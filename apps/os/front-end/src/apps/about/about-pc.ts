// @/apps/about/about.ts
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { QueryController } from '@fuyeor/query';
import { formatBytes } from '@webroamer/commons';
import { OsPropertyItem } from '@webroamer/ui';
import { fetchSystemInfo, systemKeys } from '@/api/system';

@customElement('app-about')
export class AppAbout extends SignalWatcher(LitElement) {
  static {
    [OsPropertyItem];
  }

  #infoQuery = new QueryController(this, {
    queryKey: systemKeys.info,
    queryFn: ({ signal }) => fetchSystemInfo(signal),
    staleTime: 1000 * 60 * 5,
  });

  static styles = css`
    :host {
      display: block;
      padding: 40px;
      color: white;
      text-align: center;
    }
    .logo {
      width: 100px;
      height: 100px;
      margin-bottom: 24px;
    }
    .title {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 40px;
    }

    .info-container {
      text-align: left;
      max-width: 450px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
      padding: 0 20px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
  `;

  render() {
    const data = this.#infoQuery.data;

    if (this.#infoQuery.isLoading) return html`<div>Loading system specs...</div>`;
    if (!this.#infoQuery.isRetrieved || !data) return html`<empty-state></empty-state>`;

    const { os, kernel, resources } = data;

    return html`
      <img class="logo" src="/favicon.svg" />
      <div class="title">${os.name}</div>

      <div class="info-container">
        <os-property-item label="system.about.osVersion" .value=${os.version}></os-property-item>
        <os-property-item
          label="system.about.kernel"
          .value="${kernel.type} (${kernel.version})"
        ></os-property-item>
        <os-property-item
          label="system.about.distribution"
          .value=${kernel.distro}
        ></os-property-item>
        <os-property-item
          label="system.about.memory"
          .value=${formatBytes(resources.totalMemory)}
        ></os-property-item>
        <os-property-item label="system.about.cpu" .value=${resources.cpuModel}></os-property-item>
        <os-property-item
          label="system.about.disk"
          .value=${formatBytes(resources.totalDisk)}
        ></os-property-item>
      </div>
    `;
  }
}
