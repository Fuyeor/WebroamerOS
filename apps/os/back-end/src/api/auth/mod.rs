// src/api/auth/mod.rs
pub mod types;
pub mod utils;

use crate::middleware::ActiveSession;
use crate::state::AppState;
use axum::{Json, extract::State, http::StatusCode, response::IntoResponse};
use axum_extra::extract::cookie::{Cookie, CookieJar};
use bcrypt::{DEFAULT_COST, hash};
use chrono::{DateTime, Duration as ChronoDuration, Utc};
use rand::{Rng, distributions::Alphanumeric};
use sqlx::{Row, Sqlite};
use std::sync::atomic::Ordering;
use uuid::Uuid;

use self::types::*;
use self::utils::*;

#[utoipa::path(
    get,
    path = "/auth/status",
    responses(
        (status = 200, description = "Get current auth status", body = AuthStatusResponse)
    )
)]
/// GET /auth/status - get current auth status
pub async fn get_status(
    State(state): State<AppState>,
    jar: CookieJar,
) -> Result<(CookieJar, Json<AuthStatusResponse>), StatusCode> {
    if !state.has_user.load(Ordering::Acquire) {
        return Ok((jar, Json(AuthStatusResponse::Setup)));
    }

    let token = match jar.get("session_token") {
        Some(c) => c.value().to_string(),
        None => return Ok((jar, Json(AuthStatusResponse::SignedOut))),
    };

    let record = sqlx::query::<Sqlite>(
        "SELECT s.is_locked, s.expires_at, u.id, u.username, u.nickname, u.avatar 
         FROM sessions s JOIN user u ON s.user_id = u.id 
         WHERE s.token = ?",
    )
    .bind(&token)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    match record {
        Some(row) => {
            let expires_at_str: String = row.get("expires_at");
            let expires_at = DateTime::parse_from_rfc3339(&expires_at_str)
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
                .with_timezone(&Utc);

            let now = Utc::now();
            if expires_at < now {
                return Ok((jar, Json(AuthStatusResponse::SignedOut)));
            }

            let mut out_jar = jar.clone();
            // Sliding Expiration: If the remaining time is less than 3 days, reset it to 7 days.
            if expires_at - now < ChronoDuration::days(3) {
                let new_exp = now + ChronoDuration::days(7);
                let _ = sqlx::query("UPDATE sessions SET expires_at = ? WHERE token = ?")
                    .bind(new_exp.to_rfc3339())
                    .bind(&token)
                    .execute(&state.db)
                    .await;
                out_jar = out_jar.add(create_session_cookie(token, 7));
            }

            let user = UserPublicInfo {
                id: row.get("id"),
                username: row.get("username"),
                nickname: row.get("nickname"),
                avatar: row.get("avatar"),
            };

            if row.get::<bool, _>("is_locked") {
                Ok((out_jar, Json(AuthStatusResponse::Locked { user })))
            } else {
                Ok((out_jar, Json(AuthStatusResponse::Active { user })))
            }
        }
        None => Ok((jar, Json(AuthStatusResponse::SignedOut))),
    }
}

#[utoipa::path(
    post,
    path = "/auth/setup",
    request_body = SetupRequest,
    responses(
        (status = 201, description = "Initial setup successful")
    )
)]
/// POST /auth/setup - initialize system
pub async fn setup(
    State(state): State<AppState>,
    Json(payload): Json<SetupRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    if state.has_user.load(Ordering::Acquire) {
        return Err(StatusCode::FORBIDDEN);
    }
    let hashed = match payload.password {
        Some(ref p) if !p.is_empty() => {
            Some(hash(p, DEFAULT_COST).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?)
        }
        _ => None,
    };
    sqlx::query(
        "INSERT INTO user (id, uid, username, nickname, password) VALUES (?, 1000, ?, ?, ?)",
    )
    .bind(Uuid::now_v7().to_string())
    .bind(payload.username)
    .bind(payload.nickname)
    .bind(hashed)
    .execute(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    state.has_user.store(true, Ordering::Release);
    Ok(StatusCode::CREATED)
}

#[utoipa::path(
    post,
    path = "/auth/signin",
    request_body = SigninRequest,
    responses(
        (status = 200, description = "Signin successful"),
        (status = 401, description = "Invalid credentials")
    )
)]
/// POST /auth/signin
pub async fn signin(
    State(state): State<AppState>,
    jar: CookieJar,
    Json(payload): Json<SigninRequest>,
) -> Result<(CookieJar, StatusCode), StatusCode> {
    let row = sqlx::query::<Sqlite>("SELECT id, password FROM user WHERE username = ?")
        .bind(&payload.username)
        .fetch_optional(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::UNAUTHORIZED)?;

    if !verify_password(
        payload.password.as_ref(),
        row.get::<Option<String>, _>("password").as_ref(),
    ) {
        return Err(StatusCode::UNAUTHORIZED);
    }

    // generate a 64-bit Strong Random Session Token
    let token: String = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(64)
        .map(char::from)
        .collect();

    // store in the database with a 7-day expiration period
    let exp = Utc::now() + ChronoDuration::days(7);
    sqlx::query("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
        .bind(&token)
        .bind(row.get::<String, _>("id"))
        .bind(exp.to_rfc3339())
        .execute(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // assemble the Cookie and add it to the response
    Ok((jar.add(create_session_cookie(token, 7)), StatusCode::OK))
}

#[utoipa::path(
    post,
    path = "/auth/signout",
    responses(
        (status = 200, description = "Signout successful")
    )
)]
/// POST /auth/signout
pub async fn signout(
    State(state): State<AppState>,
    jar: CookieJar,
) -> Result<(CookieJar, StatusCode), StatusCode> {
    // delete from DB
    if let Some(cookie) = jar.get("session_token") {
        let _ = sqlx::query("DELETE FROM sessions WHERE token = ?")
            .bind(cookie.value())
            .execute(&state.db)
            .await;
    }

    let mut remove = Cookie::new("session_token", "");
    remove.set_path("/");
    remove.make_removal();
    Ok((jar.add(remove), StatusCode::OK))
}

#[utoipa::path(
    post,
    path = "/auth/lock",
    responses(
        (status = 200, description = "System locked")
    )
)]
/// POST /auth/lock
pub async fn lock(
    _session: ActiveSession,
    State(state): State<AppState>,
    jar: CookieJar,
) -> Result<StatusCode, StatusCode> {
    let token = jar
        .get("session_token")
        .ok_or(StatusCode::UNAUTHORIZED)?
        .value();
    sqlx::query("UPDATE sessions SET is_locked = TRUE WHERE token = ?")
        .bind(token)
        .execute(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(StatusCode::OK)
}

#[utoipa::path(
    post,
    path = "/auth/unlock",
    request_body = UnlockRequest,
    responses(
        (status = 200, description = "System unlocked"),
        (status = 401, description = "Invalid password")
    )
)]
/// POST /auth/unlock
pub async fn unlock(
    State(state): State<AppState>,
    jar: CookieJar,
    Json(payload): Json<UnlockRequest>,
) -> Result<StatusCode, StatusCode> {
    let token = jar
        .get("session_token")
        .ok_or(StatusCode::UNAUTHORIZED)?
        .value();
    let row = sqlx::query::<Sqlite>("SELECT s.is_locked, u.password FROM sessions s JOIN user u ON s.user_id = u.id WHERE s.token = ?")
        .bind(token).fetch_optional(&state.db).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::UNAUTHORIZED)?;

    // if the lock is not held, return OK
    if !row.get::<bool, _>("is_locked") {
        return Ok(StatusCode::OK);
    }
    if !verify_password(
        payload.password.as_ref(),
        row.get::<Option<String>, _>("password").as_ref(),
    ) {
        return Err(StatusCode::UNAUTHORIZED);
    }

    // password correct; unlock
    sqlx::query("UPDATE sessions SET is_locked = FALSE WHERE token = ?")
        .bind(token)
        .execute(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(StatusCode::OK)
}
