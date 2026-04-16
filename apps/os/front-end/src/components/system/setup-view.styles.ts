// @/components/system/setup-view.styles.ts
import { css } from 'lit';

export const styles = css`
  :host {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    width: 100vw;
    background: #000;
    color: white;
  }
  .card {
    width: 100%;
    max-width: 400px;
    padding: 40px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    text-align: center;
  }
  h1 {
    font-size: 24px;
    margin-bottom: 8px;
    font-weight: 600;
  }
  p {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin-bottom: 32px;
  }
  input {
    width: 100%;
    box-sizing: border-box;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 14px;
    border-radius: 12px;
    color: white;
    margin-bottom: 16px;
    outline: none;
  }
  input:focus {
    border-color: var(--fuyeor-purple);
  }
  button {
    width: 100%;
    padding: 14px;
    background: var(--fuyeor-purple);
    border: none;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.5;
  }
`;
