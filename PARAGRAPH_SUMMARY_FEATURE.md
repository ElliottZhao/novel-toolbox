# 段落总结功能

## 功能概述

为章节页面添加了跨越段落选择功能和总结功能，用户可以：

1. **跨段落选择**：选择多个段落进行总结
2. **创建总结**：为选中的段落创建标题和内容总结
3. **查看总结**：在右侧面板中查看所有段落总结
4. **管理总结**：删除不需要的总结

## 新增功能

### 1. 数据库模型

新增了 `ParagraphSummary` 模型：

```prisma
model ParagraphSummary {
  id          String   @id @default(cuid())
  title       String   // 总结标题
  content     String   @db.Text // 总结内容
  startIndex  Int      // 起始段落索引
  endIndex    Int      // 结束段落索引
  chapterId   String
  chapter     Chapter  @relation(fields: [chapterId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([chapterId])
  @@index([startIndex, endIndex])
}
```

### 2. API 接口

新增了 `/api/paragraph-summaries` 接口：

- `GET /api/paragraph-summaries?chapterId=xxx` - 获取章节的所有总结
- `POST /api/paragraph-summaries` - 创建新的段落总结
- `DELETE /api/paragraph-summaries?id=xxx` - 删除指定的总结

### 3. 组件

#### ParagraphSummarySheet
段落总结创建组件，提供：
- 显示选中的段落内容
- 输入总结标题和内容
- 表单验证和提交

#### SummaryPanel
总结显示面板，提供：
- 显示所有段落总结
- 总结的删除功能
- 空状态提示

#### 更新的 Paragraph 组件
- 添加了段落选择功能
- 支持多选和视觉反馈
- 保持原有的角色标注功能

### 4. 页面布局

章节页面改为左右分栏布局：

- **左侧（2/3宽度）**：章节内容
  - 段落选择控件
  - 创建总结按钮
  - 章节导航

- **右侧（1/3宽度）**：总结面板
  - 显示所有段落总结
  - 粘性定位，滚动时保持可见

## 使用方法

### 1. 选择段落
1. 在章节页面中，每个段落左侧会出现复选框
2. 点击复选框选择需要总结的段落
3. 选中的段落会高亮显示（蓝色背景和左边框）

### 2. 创建总结
1. 选择多个段落后，页面顶部会出现"创建总结"按钮
2. 点击按钮打开总结创建面板
3. 输入总结标题和内容
4. 点击"创建总结"保存

### 3. 查看总结
1. 右侧面板会显示所有已创建的总结
2. 每个总结显示标题、段落范围、创建时间和内容
3. 总结按段落顺序排列

### 4. 删除总结
1. 在右侧面板中，每个总结右上角有删除按钮
2. 点击删除按钮确认删除

## 技术实现

### 状态管理
- 使用 React Query 管理服务器状态
- 使用本地状态管理段落选择
- 实时更新总结列表

### 样式设计
- 响应式布局，支持移动端
- 使用 Tailwind CSS 进行样式设计
- 遵循现有的设计系统

### 数据同步
- 创建总结后自动更新本地缓存
- 删除总结后立即更新界面
- 保持数据一致性

## 注意事项

1. 段落选择是基于段落ID的，确保数据完整性
2. 总结的段落范围使用段落索引，便于排序和显示
3. 删除总结会立即生效，请谨慎操作
4. 总结内容支持多行文本，建议合理分段

## 未来改进

1. 添加总结编辑功能
2. 支持总结的搜索和筛选
3. 添加总结的标签和分类
4. 支持总结的导出和分享
5. 添加总结的版本历史 