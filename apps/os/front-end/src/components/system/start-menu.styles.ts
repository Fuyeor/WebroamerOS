// @/components/system/start-menu.styles.ts
import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
    position: fixed;
    bottom: 60px; /* 任务栏高度 + 间距 */
    left: 12px;
    width: 300px;
    min-height: 400px;
    background: rgba(20, 20, 30, 0.85);
    background: var(--surface-raised-transparent);
    backdrop-filter: blur(30px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-md);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    transform: translateY(20px);
    opacity: 0;
    pointer-events: none;
    transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
    z-index: 1002;
  }

  :host([open]) {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }

  .menu-header {
    padding: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .menu-item {
    padding: 12px 20px;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: background 0.2s;
  }

  .menu-item:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .menu-footer {
    display: flex;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    margin-top: auto;
  }

  .footer-btn {
    flex: 1;
    background: none;
    border: none;
    color: #ccc;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px;
    cursor: pointer;
    transition:
      background 0.2s,
      color 0.2s;
  }

  .footer-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
  }

  .footer-btn:first-child {
    border-right: 1px solid rgba(255, 255, 255, 0.05);
  }

  .footer-btn > span {
    font-size: 16px;
  }
`;
