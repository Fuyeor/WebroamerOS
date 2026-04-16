// src/main.rs
#![warn(clippy::all)]
#![allow(clippy::new_without_default)]
#![allow(clippy::type_complexity)]

mod api;
mod db;
mod middleware;
mod state;

use axum::{
    Router,
    routing::{get, post},
};
use std::net::SocketAddr;
use utoipa::OpenApi;

#[derive(OpenApi)]
#[openapi(
    paths(
        api::system::get_system_info,
        api::auth::get_status,
        api::auth::setup,
        api::auth::signin,
        api::auth::signout,
        api::auth::lock,
        api::auth::unlock,
    ),
    components(schemas(
        api::system::SystemInfo,
        api::system::OsInfo,
        api::system::KernelInfo,
        api::system::ResourceInfo,
        api::auth::types::AuthStatusResponse,
        api::auth::types::UserPublicInfo,
        api::auth::types::SetupRequest,
        api::auth::types::SigninRequest,
        api::auth::types::UnlockRequest
    ))
)]
struct ApiDoc;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // initialize logging
    tracing_subscriber::fmt::init();

    // initialize db and global state
    let db_pool = db::init_db().await?;
    let app_state = state::AppState::new(db_pool).await?;

    // build routes
    let auth_routes = Router::new()
        .route("/status", get(api::auth::get_status))
        .route("/setup", post(api::auth::setup))
        .route("/signin", post(api::auth::signin))
        .route("/signout", post(api::auth::signout))
        .route("/lock", post(api::auth::lock))
        .route("/unlock", post(api::auth::unlock));

    let app = Router::new()
        .nest("/auth", auth_routes)
        .route("/system/info", get(api::system::get_system_info))
        .route("/system/terminal", get(api::terminal::ws_handler))
        .route(
            "/docs/openapi.json",
            get(|| async { axum::Json(ApiDoc::openapi()) }),
        )
        .layer(axum::middleware::from_fn_with_state(
            app_state.clone(),
            middleware::setup_interceptor,
        ))
        .with_state(app_state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
