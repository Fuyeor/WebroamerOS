// @/shared/directives/tooltip.ts
import { noChange } from 'lit';
import { AsyncDirective } from 'lit/async-directive.js';
import { directive, type PartInfo, type ElementPart, PartType } from 'lit/directive.js';

type Placement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipOptions {
  text: string;
  placement?: Placement;
  enableAria?: boolean;
}
type TooltipBindingValue = string | TooltipOptions;

// 核心指令类，继承 AsyncDirective 获得 DOM 生命周期感知能力
class TooltipDirective extends AsyncDirective {
  private el!: HTMLElement;
  private tooltipEl!: HTMLElement;
  private options: Required<TooltipOptions> | null = null;
  private showTimeout: number | null = null;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error('tooltip directive can only be used on elements');
    }
  }

  update(part: ElementPart, [value]: [TooltipBindingValue]) {
    this.el = part.element as HTMLElement;
    this.options = this.#normalizeOptions(value);

    // 第一次挂载时，创建 DOM 和事件
    if (!this.tooltipEl && this.options) {
      this.tooltipEl = document.createElement('div');
      this.tooltipEl.className = 'f-tooltip';
      this.tooltipEl.setAttribute('role', 'tooltip');
      this.tooltipEl.setAttribute('aria-hidden', 'true');

      if (!this.options.enableAria) {
        this.tooltipEl.id = `tooltip-${Math.random().toString(36).slice(2)}`;
        this.el.setAttribute('aria-describedby', this.tooltipEl.id);
      } else {
        this.el.setAttribute('aria-label', this.options.text);
      }

      this.el.addEventListener('mouseenter', this.#onEnter);
      this.el.addEventListener('mouseleave', this.#onLeave);
      this.el.addEventListener('focus', this.#onEnter);
      this.el.addEventListener('blur', this.#onLeave);
    }
    // 更新时的逻辑
    else if (this.options) {
      if (this.options.enableAria) {
        this.el.setAttribute('aria-label', this.options.text);
        this.el.removeAttribute('aria-describedby');
      }
    } else {
      this.#hide();
    }

    return noChange; // 我们只操作 DOM 属性，不改变模板内容
  }

  disconnected() {
    if (this.tooltipEl?.parentNode) this.tooltipEl.remove();
    if (this.showTimeout) window.clearTimeout(this.showTimeout);
    this.el.removeEventListener('mouseenter', this.#onEnter);
    this.el.removeEventListener('mouseleave', this.#onLeave);
    this.el.removeEventListener('focus', this.#onEnter);
    this.el.removeEventListener('blur', this.#onLeave);
  }

  // 这里为了保持指令完整性，必须有 render 方法，但我们实际在 update 里处理了一切
  render(_value: TooltipBindingValue) {
    return noChange;
  }

  // 内部工具方法
  #normalizeOptions(value: TooltipBindingValue): Required<TooltipOptions> | null {
    if (typeof value === 'string' && value)
      return { text: value, placement: 'bottom', enableAria: true };
    if (typeof value === 'object' && value?.text)
      return { placement: 'bottom', enableAria: true, ...value };
    return null;
  }

  #onEnter = (e?: FocusEvent) => {
    if (e?.type === 'focus' && e.relatedTarget === null) return;
    if (!this.options) return;
    if (this.showTimeout) window.clearTimeout(this.showTimeout);

    this.showTimeout = window.setTimeout(() => {
      this.tooltipEl.textContent = this.options!.text;
      if (!this.tooltipEl.parentNode) document.body.appendChild(this.tooltipEl);

      this.#updatePosition();

      // 应用方位类名，触发全局 CSS 的箭头和显示逻辑
      this.tooltipEl.className = `f-tooltip f-tooltip-${this.options!.placement}`;

      // 强制触发重绘
      void this.tooltipEl.offsetWidth;

      this.tooltipEl.classList.add('is-visible');
      this.tooltipEl.setAttribute('aria-hidden', 'false');
    }, 150);
  };

  #onLeave = () => this.#hide();

  #hide() {
    if (this.showTimeout) window.clearTimeout(this.showTimeout);
    this.tooltipEl?.classList.remove('is-visible');
    this.tooltipEl?.setAttribute('aria-hidden', 'true');
  }

  #updatePosition() {
    const elRect = this.el.getBoundingClientRect();
    const tooltipRect = this.tooltipEl.getBoundingClientRect();
    const placement = this.options!.placement;
    const offset = 8;
    let top = 0,
      left = 0;

    if (placement === 'top') {
      top = elRect.top - tooltipRect.height - offset;
      left = elRect.left + (elRect.width - tooltipRect.width) / 2;
    } else if (placement === 'bottom') {
      top = elRect.bottom + offset;
      left = elRect.left + (elRect.width - tooltipRect.width) / 2;
    } else if (placement === 'left') {
      top = elRect.top + (elRect.height - tooltipRect.height) / 2;
      left = elRect.left - tooltipRect.width - offset;
    } else if (placement === 'right') {
      top = elRect.top + (elRect.height - tooltipRect.height) / 2;
      left = elRect.right + offset;
    }

    // 考虑页面滚动（Tooltip 挂载在 body 上）
    this.tooltipEl.style.top = `${top + window.scrollY}px`;
    this.tooltipEl.style.left = `${left + window.scrollX}px`;
  }
}

// 导出给组件使用的函数形式指令
export const tooltip = directive(TooltipDirective);
