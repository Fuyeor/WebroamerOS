// src/main.rs
#![warn(clippy::all)]
#![allow(clippy::new_without_default)]
#![allow(clippy::type_complexity)]

mod api;

use axum::{Router, routing::get};
use std::net::SocketAddr;
use utoipa::OpenApi;

#[derive(OpenApi)]
#[openapi(
    paths(api::system::get_system_info),
    components(schemas(
        api::system::SystemInfo,
        api::system::OsInfo,
        api::system::KernelInfo,
        api::system::ResourceInfo
    ))
)]
struct ApiDoc;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // 初始化日志
    tracing_subscriber::fmt::init();

    // 构建路由
    let app = Router::new()
        .route("/system/info", get(api::system::get_system_info))
        .route("/system/terminal", get(api::terminal::ws_handler))
        .route(
            "/docs/openapi.json",
            get(|| async { axum::Json(ApiDoc::openapi()) }),
        );

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
