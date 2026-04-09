// @/main.ts
import App from './App.vue';
import router from './router';

import { createApp } from 'vue';
import { VueQueryPlugin } from '@fuyeor/vue-query';
import { initializeLocale, createHead } from '@fuyeor/commons';
import { vRipple, vTooltip } from '@fuyeor/interactify';

async function bootstrap() {
  // 创建核心实例
  const app = createApp(App);
  const head = createHead();

  // 注册插件 (顺序很重要: 状态管理 -> 路由 -> 其他)
  app.use(router);
  app.use(VueQueryPlugin);
  app.use(head);

  // 初始化全局服务
  await initializeLocale({ app });

  // 注册指令
  app.directive('ripple', vRipple);
  app.directive('tooltip', vTooltip);

  // 最终挂载
  app.mount('#app');
}

bootstrap();
