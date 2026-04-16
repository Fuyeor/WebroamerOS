// src/middleware.rs
use crate::state::AppState;
use axum::{
    extract::{FromRef, FromRequestParts, Request, State},
    http::{StatusCode, request::Parts},
    middleware::Next,
    response::Response,
};
use axum_extra::extract::cookie::CookieJar;
use chrono::{DateTime, Utc};
use sqlx::{Row, Sqlite};
use std::sync::atomic::Ordering;

/// Authentication Extractor
// Used for endpoints requiring login where the screen is not locked.
pub struct ActiveSession {
    pub user_id: String,
    pub username: String,
}
impl<S> FromRequestParts<S> for ActiveSession
where
    S: Send + Sync,
    AppState: FromRef<S>,
{
    type Rejection = StatusCode;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app_state = AppState::from_ref(state);
        let jar = CookieJar::from_headers(&parts.headers);

        let token = jar
            .get("session_token")
            .map(|c| c.value().to_string())
            .ok_or(StatusCode::UNAUTHORIZED)?;

        let record = sqlx::query::<Sqlite>(
            "SELECT s.is_locked, s.expires_at, u.id, u.username 
             FROM sessions s JOIN user u ON s.user_id = u.id 
             WHERE s.token = ?",
        )
        .bind(token)
        .fetch_optional(&app_state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        match record {
            Some(row) => {
                let expires_at_str: String = row.get("expires_at");
                let expires_at = DateTime::parse_from_rfc3339(&expires_at_str)
                    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
                    .with_timezone(&Utc);

                if expires_at < Utc::now() {
                    return Err(StatusCode::UNAUTHORIZED);
                }
                if row.get::<bool, _>("is_locked") {
                    return Err(StatusCode::FORBIDDEN);
                }

                Ok(ActiveSession {
                    user_id: row.get("id"),
                    username: row.get("username"),
                })
            }
            None => Err(StatusCode::UNAUTHORIZED),
        }
    }
}

/// Global Interceptor
// Blocks most requests when uninitialized.
pub async fn setup_interceptor(
    State(state): State<AppState>,
    req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let path = req.uri().path();

    // If the system has no users, allow access only to the 'status', 'setup', 'OpenAPI' endpoints.
    if !state.has_user.load(Ordering::Acquire) {
        if path != "/auth/setup" && path != "/auth/status" && path != "/docs/openapi.json" {
            return Err(StatusCode::SERVICE_UNAVAILABLE);
        }
    }
    Ok(next.run(req).await)
}
