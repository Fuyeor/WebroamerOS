// @/components/window/system-window.ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type WindowState, WindowManagerAPI } from '@/shared/signals/wm';

@customElement('system-window')
export class SystemWindow extends LitElement {
  @property({ type: Object }) state!: WindowState;

  static styles = css`
    :host {
      position: absolute;
      display: flex;
      flex-direction: column;
      background: var(--surface, #1e1e2e);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
      /* 只给必要的属性加动画，且避开 transform 以免拖拽抖动 */
      transition:
        opacity 0.2s,
        box-shadow 0.2s,
        border-color 0.2s;
      will-change: transform, width, height;
    }

    /* 占满父级 screen 的全部空间 */
    :host([maximized]) {
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      transform: none !important;
      border-radius: 0;
      border: none;
    }

    :host([minimized]) {
      display: none !important;
    }
    :host([focused]) {
      border-color: rgba(255, 255, 255, 0.3);
      z-index: 999;
    }

    .title-bar {
      height: 40px;
      background: rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      user-select: none;
      cursor: grab;
    }
    .window-title {
      color: #eee;
      font-size: 13px;
      font-weight: 600;
      pointer-events: none;
    }
    .window-controls {
      display: flex;
      gap: 8px;
      z-index: 20;
    }
    .control-btn {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
    }
    .btn-close {
      background: #ff5f56;
    }
    .btn-minimize {
      background: #ffbd2e;
    }
    .btn-maximize {
      background: #27c93f;
    }

    .window-content {
      flex: 1;
      position: relative;
      background: #11111b;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* 强制投射进来的真实应用组件撑满整个空间，并自己接管滚动条 */
    ::slotted(*) {
      flex: 1;
      width: 100%;
      height: 100%;
      overflow-y: auto;
    }

    .resize-handle {
      position: absolute;
      z-index: 10;
    }
    .resize-handle.right {
      top: 0;
      right: -4px;
      width: 8px;
      height: 100%;
      cursor: e-resize;
    }
    .resize-handle.bottom {
      bottom: -4px;
      left: 0;
      width: 100%;
      height: 8px;
      cursor: s-resize;
    }
    .resize-handle.corner {
      bottom: -4px;
      right: -4px;
      width: 12px;
      height: 12px;
      cursor: se-resize;
    }
  `;

  #currentX = 0;
  #currentY = 0;
  #currentW = 0;
  #currentH = 0;

  // 拖拽
  #onDragStart = (e: MouseEvent) => {
    if (this.state.isMaximized) return;
    WindowManagerAPI.restoreAndFocus(this.state.id);

    const startX = e.clientX - this.state.x;
    const startY = e.clientY - this.state.y;

    const onMove = (me: MouseEvent) => {
      this.#currentX = me.clientX - startX;
      this.#currentY = me.clientY - startY;
      // 直接操作 DOM 样式，绕过信号系统的高频重绘，实现 0 延迟
      this.style.transform = `translate(${this.#currentX}px, ${this.#currentY}px)`;
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      // 结束后一次性同步回信号系统
      WindowManagerAPI.updateBounds(this.state.id, { x: this.#currentX, y: this.#currentY });
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // 调整大小
  #onResizeStart = (e: MouseEvent, type: string) => {
    e.stopPropagation();
    WindowManagerAPI.restoreAndFocus(this.state.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = this.state.width;
    const startH = this.state.height;

    const onMove = (me: MouseEvent) => {
      if (type.includes('right')) {
        this.#currentW = Math.max(300, startW + (me.clientX - startX));
        this.style.width = `${this.#currentW}px`;
      }
      if (type.includes('bottom')) {
        this.#currentH = Math.max(200, startH + (me.clientY - startY));
        this.style.height = `${this.#currentH}px`;
      }
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      WindowManagerAPI.updateBounds(this.state.id, {
        width: this.#currentW || startW,
        height: this.#currentH || startH,
      });
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  render() {
    this.toggleAttribute('focused', this.state.isFocused);
    this.toggleAttribute('maximized', this.state.isMaximized);
    this.toggleAttribute('minimized', this.state.isMinimized);

    // 初始定位
    if (!this.state.isMaximized) {
      this.style.transform = `translate(${this.state.x}px, ${this.state.y}px)`;
      this.style.width = `${this.state.width}px`;
      this.style.height = `${this.state.height}px`;
    }
    this.style.zIndex = `${this.state.zIndex}`;

    return html`
      <header
        class="title-bar"
        @mousedown=${this.#onDragStart}
        @dblclick=${() => WindowManagerAPI.toggleMaximize(this.state.id)}
      >
        <div class="window-title">${this.state.title}</div>
        <div class="window-controls" @mousedown=${(e: Event) => e.stopPropagation()}>
          <button
            class="control-btn btn-minimize"
            @click=${() => WindowManagerAPI.minimizeApp(this.state.id)}
          ></button>
          <button
            class="control-btn btn-maximize"
            @click=${() => WindowManagerAPI.toggleMaximize(this.state.id)}
          ></button>
          <button
            class="control-btn btn-close"
            @click=${() => WindowManagerAPI.closeApp(this.state.id)}
          ></button>
        </div>
      </header>
      <div
        class="window-content"
        @mousedown=${() => WindowManagerAPI.restoreAndFocus(this.state.id)}
      >
        <slot></slot>
      </div>
      <div
        class="resize-handle right"
        @mousedown=${(e: MouseEvent) => this.#onResizeStart(e, 'right')}
      ></div>
      <div
        class="resize-handle bottom"
        @mousedown=${(e: MouseEvent) => this.#onResizeStart(e, 'bottom')}
      ></div>
      <div
        class="resize-handle corner"
        @mousedown=${(e: MouseEvent) => this.#onResizeStart(e, 'right-bottom')}
      ></div>
    `;
  }
}
