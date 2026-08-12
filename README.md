# b64kit

Base64 图片工具箱：**base64 ⇄ IMG / XML / ASCII**。纯浏览器本地处理，图片与数据不会上传到任何服务器。

## 特性

- **解码方向**：粘贴 base64 / data URI / `<img>` 标签 → 自动识别格式，输出三种形态
  - **IMG**：图片实时预览 + MIME / 大小信息
  - **XML**：含 MIME 类型与 base64 数据的通用 XML 包装
  - **ASCII**：像素亮度映射的字符画（可调宽度 / 字符渐变 / 反色，可下载 .txt）
- **编码方向**：上传图片 / XML 等任意文件 → data URI；文本 → UTF-8 base64
- **自动嗅探** MIME 类型（PNG / JPG / GIF / WebP / BMP / ICO / SVG / XML）
- 深色主题，响应式布局

## 技术栈

| 技术 | 用途 |
|------|------|
| React 19 + TypeScript | 编程语言与 UI |
| Vite | 构建工具 |
| TailwindCSS 4 + shadcn/ui | 样式与组件 |
| Vitest + Testing Library | 测试 |
| Biome + cspell | Lint / Format / 拼写检查 |
| pnpm | 包管理器 |

## 快速开始

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm run dev

# 构建（产物在 dist/，可部署到静态托管）
pnpm run build

# 预览构建产物
pnpm run preview
```

## 项目结构

```
src/
├── main.tsx              # React 入口
├── index.css             # Tailwind + shadcn 主题
├── components/           # React 组件
│   ├── App.tsx           # 顶层布局与方向切换
│   ├── DecodePanel.tsx   # base64 → IMG/XML/ASCII
│   ├── EncodePanel.tsx   # 图片/文本 → base64
│   ├── FileDrop.tsx      # 拖拽/选择文件
│   └── output/           # 各输出面板
└── lib/
    ├── core/             # 纯逻辑层（零 DOM，node 直接单测）
    │   ├── base64.ts     # 编解码、data URI、输入归一化
    │   ├── mime.ts       # 魔数嗅探
    │   ├── xml.ts        # XML 包装生成
    │   └── ascii.ts      # 字符画算法
    └── browser/          # 浏览器能力（canvas 解码、剪贴板）
```

## 可用脚本

| 命令 | 说明 |
|------|------|
| `pnpm run dev` | 开发模式 |
| `pnpm run build` | 类型检查 + 构建 |
| `pnpm run preview` | 预览构建产物 |
| `pnpm run test` | 运行测试 |
| `pnpm run test:watch` | 测试监听模式 |
| `pnpm run test:coverage` | 测试覆盖率报告 |
| `pnpm run lint` | 代码检查 |
| `pnpm run lint:fix` | 自动修复代码问题 |
| `pnpm run format` | 格式化代码 |
| `pnpm run typecheck` | TypeScript 类型检查 |
| `pnpm run check` | 完整检查 (typecheck + lint) |
| `pnpm run check:fix` | 检查并修复 |
| `pnpm run spellcheck` | 拼写检查 |

## 架构设计

沿用「纯逻辑层 / 浏览器能力层 / UI 装配层」三层分离：

- **`lib/core/`**：纯函数，零 DOM 依赖，node 环境直接单测；图片解码与剪贴板等浏览器能力通过**接口注入**，测试注入 fake。
- **数据流**：`Uint8Array` 统一贯穿（base64 解码的字节表示）。
- **ASCII 算法**：「亮度→字符」映射与「图片→像素矩阵」解码彻底分离；区域 box 平均采样整体 O(源像素)，大图不卡顿。

## 测试

- 纯逻辑层：node 环境单测（base64 / mime / img / xml / ascii）
- UI 层：happy-dom + Testing Library，注入 fake 解码器
- 覆盖率阈值：行 / 函数 / 分支 / 语句均 ≥ 80%

## 许可证

[MIT](LICENSE) © 2026 shenjingnan
