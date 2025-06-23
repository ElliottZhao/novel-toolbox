# Novel Toolbox - 小说工具箱

一个专为小说内容管理和分析设计的现代化Web应用，基于Next.js 15和Prisma构建。

## 🚀 主要功能

### 📚 书籍管理
- **书籍库管理**: 支持添加、编辑和管理多本小说
- **番茄小说集成**: 自动从番茄小说网站获取书籍信息和目录
- **状态管理**: 支持草稿、已发布、已归档等书籍状态
- **批量操作**: 支持批量下载章节内容

### 📖 章节管理
- **章节列表**: 按书籍和分卷组织章节
- **内容获取**: 自动从番茄小说获取章节内容
- **状态跟踪**: 实时显示章节内容获取和分析状态
- **下载功能**: 支持单个或批量下载章节内容

### 🎭 角色标注系统
- **智能角色识别**: 自动识别文本中的角色名称
- **角色管理**: 创建和管理角色信息，支持别名设置
- **文本标注**: 在章节内容中标注角色出现位置
- **标注历史**: 查看和管理所有角色标注记录

### 📊 数据分析
- **统计面板**: 实时显示新增章节、已分析章节等关键指标
- **进度跟踪**: 可视化显示内容分析进度
- **图表展示**: 交互式图表展示数据趋势

### ⚙️ 后台任务系统
- **任务队列**: 基于BullMQ的可靠任务处理系统
- **进度监控**: 实时显示任务执行进度
- **任务管理**: 支持多种任务类型（获取目录、下载内容等）
- **错误处理**: 完善的错误处理和重试机制

## 🛠️ 技术栈

### 前端
- **Next.js 15**: 使用App Router的现代化React框架
- **TypeScript**: 类型安全的JavaScript开发
- **Tailwind CSS**: 实用优先的CSS框架
- **shadcn/ui**: 高质量的React组件库
- **TanStack Query**: 强大的数据获取和缓存库
- **Recharts**: 数据可视化图表库
- **Sonner**: 现代化的Toast通知库

### 后端
- **Prisma**: 类型安全的数据库ORM
- **PostgreSQL**: 关系型数据库
- **BullMQ**: Redis驱动的任务队列
- **Zod**: TypeScript优先的模式验证

### 开发工具
- **ESLint**: 代码质量检查
- **Turbopack**: 快速的开发服务器
- **pnpm**: 高效的包管理器

## 📦 安装和运行

### 环境要求
- Node.js 18+
- PostgreSQL 数据库
- Redis 服务器

### 安装依赖
```bash
pnpm install
```

### 环境配置
创建 `.env.local` 文件并配置以下环境变量：
```env
DATABASE_URL="postgresql://username:password@localhost:5432/novel_toolbox"
REDIS_URL="redis://localhost:6379"
FANQIE_SESSION_ID="your_fanqie_session_id"  # 可选，用于获取付费章节
```

### 数据库设置
```bash
# 运行数据库迁移
pnpm prisma migrate dev

# 生成Prisma客户端
pnpm prisma generate

# 可选：运行种子数据
pnpm prisma db seed
```

### 启动开发服务器
```bash
# 启动前端开发服务器
pnpm dev

# 启动后台任务处理器（新终端）
pnpm worker
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 🏗️ 项目结构

```
novel-toolbox/
├── app/                    # Next.js App Router
│   ├── (main)/            # 主应用路由
│   │   ├── books/         # 书籍管理页面
│   │   └── chapters/      # 章节管理页面
│   └── api/               # API路由
│       ├── books/         # 书籍API
│       ├── chapters/      # 章节API
│       ├── characters/    # 角色API
│       └── tasks/         # 任务API
├── components/            # React组件
│   ├── ui/               # 基础UI组件
│   └── ...               # 业务组件
├── lib/                  # 工具库
├── prisma/               # 数据库模型和迁移
├── scripts/              # 后台任务脚本
└── types/                # TypeScript类型定义
```

## 🔧 主要API端点

### 书籍管理
- `GET /api/books` - 获取所有书籍
- `POST /api/books` - 创建新书籍

### 章节管理
- `GET /api/chapters` - 获取章节列表
- `POST /api/chapters/[id]/download` - 下载章节内容
- `GET /api/chapters/[id]/navigation` - 获取章节导航信息

### 角色管理
- `GET /api/characters` - 获取角色列表
- `POST /api/characters` - 创建新角色
- `POST /api/character-annotations` - 创建角色标注

### 任务管理
- `GET /api/tasks` - 获取任务状态
- `POST /api/tasks` - 创建新任务

## 🎯 使用指南

### 添加新书籍
1. 在书籍管理页面点击"添加书籍"
2. 输入番茄小说的书籍ID
3. 系统会自动获取书籍信息和目录

### 下载章节内容
1. 在章节列表中选择需要下载的章节
2. 点击"EMPTY"状态的下载按钮
3. 系统会在后台自动获取章节内容

### 角色标注
1. 在章节详情页面选择文本
2. 系统会自动识别可能的角色
3. 选择现有角色或创建新角色
4. 完成标注后可以在角色管理页面查看

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## �� 许可证

MIT License
