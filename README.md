<div align="center">
  <img src="https://img.shields.io/badge/Vue.js-3.4-4FC08D?style=flat&logo=vuedotjs&logoColor=white" alt="Vue.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Element%20Plus-2.6-409EFF?style=flat&logo=element&logoColor=white" alt="Element Plus" />
  <img src="https://img.shields.io/badge/Pinia-2.1-FFD859?style=flat&logo=pinia&logoColor=white" alt="Pinia" />
  <img src="https://img.shields.io/badge/Axios-1.7-5A29E4?style=flat&logo=axios&logoColor=white" alt="Axios" />
</div>

<h1 align="center">🎬 Vidego Frontend</h1>

<p align="center">
  <strong>视频分享平台前端</strong> —— B 站风格、响应式布局、Composition API
</p>

<p align="center">
  采用 Vue 3 + TypeScript 构建，覆盖视频消费全链路体验。
</p>
<br />

---

## 📋 技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| 框架 | Vue 3.4 (Composition API) | 响应式 UI 构建 |
| 语言 | TypeScript 5.4 | 类型安全、IDE 智能提示 |
| 构建 | Vite 5 | 极速 HMR、按需编译 |
| UI 组件 | Element Plus 2.6 | 表单/列表/弹窗/分页 |
| 状态管理 | Pinia 2.1 | 用户状态、全局配置 |
| 路由 | Vue Router 4 | SPA 导航、路由守卫 |
| HTTP | Axios 1.7 | 请求拦截、Token 管理 |
| 图标 | Element Plus Icons | 全局注册、按需使用 |
| 部署 | Nginx (Docker) | 反向代理 + 静态托管 |

---

## ✨ 功能特性

### 页面 & 交互
- **首页** — 分类标签栏、响应式视频网格、无限加载
- **视频播放** — HTML5 播放器、UP 主信息、点赞/收藏/分享、评论区
- **视频上传** — 拖拽上传、实时进度条、视频预览、标签管理
- **个人中心** — 用户信息、投稿/点赞/收藏/关注/粉丝五选项卡
- **搜索** — 全文搜索、关键词高亮、分页加载
- **登录/注册** — 表单校验、Token 持久化、中文用户名支持

### 技术亮点
- **响应式布局** — 桌面/平板/手机三断点适配
- **B 站风格 UI** — 粉色主题、圆角卡片、渐变品牌区
- **乐观更新** — 点赞/收藏即时反馈，错误时自动回滚
- **XHR 进度追踪** — 视频上传实时百分比 + 阶段提示
- **请求拦截器** — 自动注入 Token、统一错误处理、401 自动跳登录
- **路由守卫** — 未登录重定向、已登录跳过登录页

---

## 🏗 项目结构

```
vidego-web/
├── index.html                        # 入口 HTML
├── vite.config.ts                    # Vite 配置（别名 + 代理）
├── tsconfig.json                     # TypeScript 配置
├── package.json
├── nginx/
│   └── vidego.conf                   # Nginx 生产配置
├── Dockerfile                        # 前端镜像
└── src/
    ├── main.ts                       # 应用入口
    ├── App.vue                       # 根组件
    ├── api/                          # API 模块化
    │   ├── request.ts                # Axios 实例 + 拦截器
    │   ├── auth.ts                   # 认证相关
    │   ├── user.ts                   # 用户/关注
    │   ├── video.ts                  # 视频/点赞/收藏
    │   ├── comment.ts                # 评论
    │   └── feed.ts                   # 推荐/搜索
    ├── types/                        # TypeScript 类型定义
    │   ├── api.ts                    # 通用 API 响应类型
    │   ├── user.ts / video.ts / comment.ts
    ├── stores/                       # Pinia 状态管理
    │   └── auth.ts                   # 用户认证状态
    ├── router/
    │   └── index.ts                  # 路由表 + 导航守卫
    ├── layouts/
    │   ├── DefaultLayout.vue         # 全局布局容器
    │   └── components/HeaderNav.vue  # 顶栏导航
    ├── components/                   # 可复用组件
    │   ├── VideoCard.vue             # 视频卡片
    │   ├── VideoPlayer.vue           # 视频播放器
    │   ├── CommentSection.vue        # 评论区容器
    │   └── CommentItem.vue           # 评论项
    ├── composables/                  # 组合式函数
    │   ├── useAuth.ts
    │   └── usePagination.ts
    └── views/                        # 页面
        ├── home/HomeView.vue         # 首页推荐
        ├── login/LoginView.vue       # 登录
        ├── login/RegisterView.vue    # 注册
        ├── video/VideoDetailView.vue # 视频播放页
        ├── upload/UploadView.vue     # 视频上传
        ├── search/SearchView.vue     # 搜索结果
        └── user/
            ├── ProfileView.vue       # 个人中心
            └── SettingsView.vue      # 设置
```

---

## 🚀 本地开发

### 前置条件

- Node.js 18+
- npm 9+

### 启动步骤

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 打开浏览器
open http://localhost:5173
```

### 环境变量

```env
# .env.development
VITE_APP_TITLE=Vidego
VITE_API_BASE_URL=/api           # 开发环境通过 Vite proxy 转发
```

> 开发模式下 Vite 自动代理 `/api` → `http://localhost:8080`，无需处理跨域。

---

## 🐳 Docker 部署

### 方案：Nginx 挂载部署（无需构建镜像）

前端采用官方 `nginx:alpine` 镜像，通过宿主机卷挂载静态文件和配置，**前端改页面无需重新构建镜像**。

### Nginx 配置

```nginx
# nginx/vidego.conf（核心配置摘要）

server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # SPA 路由 fallback
    location / { try_files $uri $uri/ /index.html; }

    # API 反向代理
    location /api/ { proxy_pass http://backend:8080; }

    # 上传代理（安全直传 MinIO）
    location /upload-minio/ { proxy_pass http://minio:9000/; }

    # 存储资源代理
    location /storage/videos/ { proxy_pass http://minio:9000/vidego-videos/; }
    location /storage/covers/ { proxy_pass http://minio:9000/vidego-covers/; }
    location /storage/avatars/ { proxy_pass http://minio:9000/vidego-avatars/; }
}
```

### 部署步骤

```bash
# 1. 构建前端
npm install
npm run build
cp -r dist/ deploy/frontend/dist/

# 2. 上传服务器
scp -r deploy/ root@<IP>:/opt/vidego/

# 3. 启动 Nginx 容器（接入后端网桥）
docker run -d \
  --name vidego-frontend \
  --restart always \
  -p 8081:80 \
  -v /opt/vidego/frontend/dist:/usr/share/nginx/html:ro \
  -v /opt/vidego/frontend/nginx/vidego.conf:/etc/nginx/conf.d/default.conf:ro \
  --network deploy_vidego-net \
  nginx:alpine

# 访问 http://<IP>:8081
```

> 前端更新只需重新 `npm run build` → 替换 `dist/` → `docker restart vidego-frontend`，无需重建镜像。

---

## 📖 路由说明

| 路径 | 页面 | 认证要求 |
|------|------|---------|
| `/home` | 首页推荐 | 公开 |
| `/login` | 登录 | 仅游客 |
| `/register` | 注册 | 仅游客 |
| `/video/:id` | 视频播放 | 公开 |
| `/upload` | 视频上传 | 需登录 |
| `/search?q=` | 搜索结果 | 公开 |
| `/user/:id` | 个人中心 | 公开 |
| `/settings` | 编辑资料 | 需登录 |

---

## 🏆 项目亮点

### 1. B 站风格体验
粉色主题 + 圆角卡片 + 渐变品牌区 + 双栏视频详情布局，从视觉到交互贴近主流视频平台。

### 2. 全链路状态覆盖
每个页面覆盖 **Loading / Empty / Error / Data** 四种状态，骨架屏 + 错误提示 + 空状态引导。

### 3. 响应式三断点
| 断点 | 宽度 | 布局 |
|------|------|------|
| Desktop | >860px | 双栏 / 四列网格 |
| Tablet | 480-860px | 单栏 / 三列网格 |
| Mobile | <480px | 全屏 / 两列网格 |

### 4. 安全的文件上传
预签名 URL 结合 XHR 进度追踪 + Nginx 代理转发，浏览器直传对象存储，不经后端中转。

