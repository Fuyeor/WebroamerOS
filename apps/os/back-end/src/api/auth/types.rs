// src/api/auth/types.rs
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UserPublicInfo {
    pub id: String,
    pub username: String,
    pub nickname: String,
    pub avatar: Option<String>,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase", tag = "state")]
pub enum AuthStatusResponse {
    Setup,
    SignedOut,
    Locked { user: UserPublicInfo },
    Active { user: UserPublicInfo },
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct SetupRequest {
    pub username: String,
    pub nickname: String,
    pub password: Option<String>,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct SigninRequest {
    pub username: String,
    pub password: Option<String>,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UnlockRequest {
    pub password: Option<String>,
}
