// src/api/terminal.rs
use axum::{
    extract::{
        WebSocketUpgrade,
        ws::{Message, WebSocket},
    },
    response::IntoResponse,
};
use futures_util::{SinkExt, StreamExt};
use pty_process::{Command as PtyCommand, Pty, Size};
use serde::Deserialize;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

/// 前端发送到后端的指令结构
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "type")]
enum TerminalInput {
    /// 用户在终端输入的数据
    Stdin { data: String },
    /// 终端尺寸变化
    Resize { cols: u16, rows: u16 },
}

/// WebSocket 连接处理函数
pub async fn ws_handler(ws: WebSocketUpgrade) -> impl IntoResponse {
    ws.on_upgrade(handle_socket)
}

/// 处理单个 WebSocket 连接的生命周期
async fn handle_socket(socket: WebSocket) {
    // 创建 PTY
    let pty = match Pty::new() {
        Ok(p) => p,
        Err(e) => {
            tracing::error!("Failed to create PTY: {}", e);
            return;
        }
    };

    // 使用 pty_process::Command 启动 bash，并关联 pts
    let mut cmd = PtyCommand::new("bash");
    let pts = match pty.pts() {
        Ok(p) => p,
        Err(e) => {
            tracing::error!("Failed to get PTS: {}", e);
            return;
        }
    };

    // 启动进程并附加到 PTY
    if let Err(e) = cmd.spawn(&pts) {
        tracing::error!("Failed to spawn bash: {}", e);
        return;
    }

    // 将 pty 拆分为两个拥有所有权的读写半部
    let (mut pty_reader, mut pty_writer) = pty.into_split();
    let (mut ws_sender, mut ws_receiver) = socket.split();

    // 任务 A: PTY 输出 -> WebSocket
    let pty_to_ws = tokio::spawn(async move {
        let mut buffer = [0u8; 4096];
        while let Ok(n) = pty_reader.read(&mut buffer).await {
            if n == 0 {
                break;
            }
            if let Ok(text) = std::str::from_utf8(&buffer[..n]) {
                if ws_sender
                    .send(Message::Text(text.to_string().into()))
                    .await
                    .is_err()
                {
                    break;
                }
            }
        }
    });

    // 任务 B: WebSocket 输入 -> PTY
    let ws_to_pty = tokio::spawn(async move {
        while let Some(Ok(msg)) = ws_receiver.next().await {
            if let Message::Text(text) = msg {
                if let Ok(input) = serde_json::from_str::<TerminalInput>(text.as_str()) {
                    match input {
                        TerminalInput::Stdin { data } => {
                            let _ = pty_writer.write_all(data.as_bytes()).await;
                        }
                        TerminalInput::Resize { cols, rows } => {
                            // ✨ OwnedWritePty 拥有 resize 方法！
                            let _ = pty_writer.resize(Size::new(rows, cols));
                        }
                    }
                }
            }
        }
    });

    tokio::select! {
        _ = pty_to_ws => {},
        _ = ws_to_pty => {},
    };
    tracing::info!("Terminal session closed.");
}
