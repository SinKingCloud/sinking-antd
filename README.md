# sinking-antd

一个基于 Ant Design 和 antd-style 构建的企业级 React 组件库，专为中后台应用设计。

## ✨ 特性

- 🎨 **主题定制**：完整的主题系统，支持亮色/暗色/跟随系统
- 📦 **开箱即用**：高质量的 React 组件
- 🔧 **TypeScript**：完整的类型定义
- 🎯 **企业级**：适用于中后台产品
- 🚀 **性能优化**：内置性能优化
- 📱 **响应式**：自适应各种屏幕

## 📦 安装

```bash
npm install sinking-antd
# 或
yarn add sinking-antd
# 或
pnpm add sinking-antd
```

### Peer Dependencies

```bash
npm install react react-dom antd @ant-design/icons antd-style
```

## 🔨 快速开始

```tsx
import { Theme, Layout, ProTable } from 'sinking-antd';

function App() {
  return (
    <Theme>
      <Layout menus={menus} pathname={pathname}>
        <ProTable columns={columns} request={fetchData} />
      </Layout>
    </Theme>
  );
}
```

## 📚 组件列表

| 组件 | 说明 |
|------|------|
| Theme | 主题管理 |
| Layout | 后台布局 |
| ProTable | 高级表格 |
| ProModal | 高级弹窗 |
| Icon | 图标 |
| Title | 标题 |
| Breadcrumb | 面包屑 |
| Animation | 动画 |
| Antd | 工具（Message、Notification、Modal）|