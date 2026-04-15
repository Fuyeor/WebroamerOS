// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [],
  // 私有包路径解析
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    // 测试浏览器环境
    environment: 'jsdom',

    // 共享的测试文件查找模式
    // 确保它能找到所有子包的测试文件
    include: ['**/*.spec.ts'],

    // 覆盖率配置
    coverage: {
      provider: 'v8',
      enabled: true,
      reportsDirectory: './coverage', // 覆盖率 HTML 文件夹

      // 指定收集覆盖率的文件
      include: ['**/src/**/*.ts'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.spec.ts'], // 排除测试文件和编译输出
    },

    // 配置 Monorepo 的根目录
    root: './',

    // 其他优化
    passWithNoTests: true, // 即使没有测试文件也通过
    globals: true, // 使用 describe, it, expect 的全局变量
  },
});
