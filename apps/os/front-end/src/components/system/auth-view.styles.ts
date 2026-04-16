// @/components/system/auth-view.styles.ts
import { css } from 'lit';

export const styles = css`
  :host {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    width: 100vw;
    background: radial-gradient(circle at center, #1a1a2e 0%, #000 100%);
    backdrop-filter: blur(40px);
    color: white;
    font-family: system-ui;
  }
  .auth-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 320px;
  }

  .avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    margin-bottom: 24px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }
  .name-display {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 32px;
    letter-spacing: 0.5px;
  }

  input {
    width: 100%;
    box-sizing: border-box;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 16px;
    border-radius: 12px;
    color: white;
    margin-bottom: 16px;
    font-size: 16px;
    text-align: center;
    outline: none;
    transition: border-color 0.2s;
  }
  input:focus {
    border-color: rgba(255, 255, 255, 0.5);
  }

  button {
    width: 100%;
    padding: 16px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    backdrop-filter: blur(10px);
    transition: background 0.2s;
  }
  button:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  button:disabled {
    opacity: 0.3;
    cursor: wait;
  }
`;
