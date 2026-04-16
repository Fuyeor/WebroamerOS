// src/db.rs
use sqlx::{SqlitePool, sqlite::SqliteConnectOptions};
use std::fs;
use std::str::FromStr;

pub async fn init_db() -> anyhow::Result<SqlitePool> {
    // ensures that the "data" directory exists; if not, create it
    let data_dir = "data";
    if !fs::metadata(data_dir).is_ok() {
        fs::create_dir_all(data_dir)?;
        tracing::info!("Created data directory at {}", data_dir);
    }

    // set up the database; automatically create the file if it does not exist.
    let options = SqliteConnectOptions::from_str("sqlite://data/data.db?mode=rwc")?
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
        .create_if_missing(true);

    let pool = SqlitePool::connect_with(options).await?;

    sqlx::migrate!("./migrations").run(&pool).await?;

    tracing::info!("Database initialized and migrations applied successfully.");

    Ok(pool)
}
