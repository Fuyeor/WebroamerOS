// src/api/system.rs
use axum::{Json, response::IntoResponse};
use serde::Serialize;
use sysinfo::System;
use utoipa::ToSchema;

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct OsInfo {
    pub name: String,
    pub version: String,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct KernelInfo {
    pub r#type: String,
    pub version: String,
    pub distro: String,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ResourceInfo {
    pub total_memory: u64,
    pub total_disk: u64,
    pub cpu_model: String,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct SystemInfo {
    pub os: OsInfo,
    pub kernel: KernelInfo,
    pub resources: ResourceInfo,
}

#[utoipa::path(
    get,
    path = "/system/info",
    responses(
        (status = 200, description = "Get device or system info", body = SystemInfo)
    )
)]

pub async fn get_system_info() -> impl IntoResponse {
    use sysinfo::{CpuRefreshKind, Disks, MemoryRefreshKind, RefreshKind};

    let mut sys = System::new_with_specifics(
        RefreshKind::nothing()
            .with_memory(MemoryRefreshKind::nothing().with_ram())
            .with_cpu(CpuRefreshKind::nothing()),
    );

    // 刷新 CPU 品牌信息需要这一步
    sys.refresh_cpu_usage();

    // get cpu model: take the brand name of the first CPU
    let cpu_model = sys
        .cpus()
        .first()
        .map(|cpu| cpu.brand().to_string())
        .unwrap_or_else(|| "Unknown CPU".into());

    // satisfy the requirement of "total disk space"
    let disks = Disks::new_with_refreshed_list();
    let total_disk = disks.iter().map(|d| d.total_space()).sum();

    Json(SystemInfo {
        os: OsInfo {
            name: "WebroamerOS (Preview)".into(),
            // automatically read version from Cargo.toml
            version: env!("CARGO_PKG_VERSION").into(),
        },
        kernel: KernelInfo {
            r#type: System::name().unwrap_or_else(|| "Linux".into()),
            version: System::kernel_version().unwrap_or_default(),
            // e.g. "Ubuntu 22.04 LTS"
            distro: System::long_os_version().unwrap_or_default(),
        },
        resources: ResourceInfo {
            total_memory: sys.total_memory(),
            total_disk,
            cpu_model,
        },
    })
}
