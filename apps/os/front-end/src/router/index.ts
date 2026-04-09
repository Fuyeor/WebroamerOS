// @/router/index.ts
import { createRouter, type RouteRecord } from '@fuyeor/vue-router';
import { useTransitionBar } from '@fuyeor/interactify';

const { start, done } = useTransitionBar();

// 根路由配置
const routes: Array<RouteRecord> = [
  {
    // webroamer.fuyeor.com/
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    props: true,
    meta: {
      overrideTitle: ['site.name', ':', 'site.title'],
    },
  },

  // 404
  {
    path: '/*', 
    name: 'NotFound',
    component: () => import('@fuyeor/interactify/views').then((m) => m.NotFoundView),
    meta: {
      titleKey: 'notFound.title',
    },
  },
];

// 创建路由实例
const router = createRouter({ routes });

// 路由守卫
router.beforeEach(async (to, from) => {
  // 启动顶部进度条
  start();
});

router.afterEach((to) => {
  done();
});

router.onError(() => {
  done();
});

export default router;
