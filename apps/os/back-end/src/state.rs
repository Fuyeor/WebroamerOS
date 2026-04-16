// src/state.rs
use sqlx::SqlitePool;
use std::sync::{Arc, atomic::AtomicBool};

/// The system's global state
/// which will be injected into all Axum routes.
#[derive(Clone)]
pub struct AppState {
    pub db: SqlitePool,
    /// A memory-level flag indicating whether the system has been initialized
    /// i.e., whether at least one user exists.
    pub has_user: Arc<AtomicBool>,
}

impl AppState {
    /// Initializes upon program startup
    /// checking whether users already exist in the database.
    pub async fn new(db: SqlitePool) -> Result<Self, sqlx::Error> {
        let row: (i64,) = sqlx::query_as::<sqlx::Sqlite, (i64,)>("SELECT COUNT(1) FROM user")
            .fetch_one(&db)
            .await?;

        Ok(Self {
            db,
            has_user: Arc::new(AtomicBool::new(row.0 > 0)),
        })
    }
}
