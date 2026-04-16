// src/api/auth/utils.rs
use axum_extra::extract::cookie::{Cookie, SameSite};
use bcrypt::verify;
use time::Duration;

/// generate a session cookie with given token and expiration in days
pub fn create_session_cookie(token: String, days: i64) -> Cookie<'static> {
    Cookie::build(("session_token", token))
        .path("/")
        .http_only(true)
        .secure(true)
        .same_site(SameSite::Strict)
        .max_age(Duration::days(days))
        .build()
}

/// verify password (supports empty password)
pub fn verify_password(input: Option<&String>, db_hash: Option<&String>) -> bool {
    match (input.map(|s| s.as_str()), db_hash.map(|s| s.as_str())) {
        // input empty, db does not have hash -> pass
        (None | Some(""), None) => true,
        // both have value -> verify with bcrypt
        (Some(pwd), Some(hash)) => verify(pwd, hash).unwrap_or(false),
        // other cases (
        // 1. has password but input empty, or
        // 2. no password but input something) -> reject
        _ => false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_verify_password_logic() {
        // Scenario 1: No password in the database, input is also empty -> Should pass
        assert!(verify_password(None, None));
        assert!(verify_password(Some(&"".to_string()), None));

        // Scenario 2: Password exists in the database, input is correct -> Should pass
        let hashed = bcrypt::hash("secret", bcrypt::DEFAULT_COST).unwrap();
        assert!(verify_password(Some(&"secret".to_string()), Some(&hashed)));

        // Scenario 3: Password exists in the database, input is incorrect -> Should fail
        assert!(!verify_password(
            Some(&"wrong_pwd".to_string()),
            Some(&hashed)
        ));

        // Scenario 4: No password in the database, but a value was provided -> Should fail
        assert!(!verify_password(Some(&"hacker".to_string()), None));
    }
}
