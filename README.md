# 🌌 《道德经》中西双语语料库及 AI 辅助研究平台 (V1.0)

**项目定位：** 融合"数字汉学"与"西班牙先锋"美学的交互式学术平台。

---

## 🎨 1. 设计美学与交互风格 (Design System)

* **视觉概念 (Cyber-Borges)：** 东方禅意与西语魔幻现实的数字交织。

* **色彩基调：**
    * 背景色："宣纸白"与"竹简青"，传递道家的静谧与无形。
    * 强调色："阿罕布拉红" (Alhambra Red) 与"安达卢西亚金"，用于突出西译本界面与知识图谱的高亮节点，象征跨文化碰撞。

* **交互体验：** 极简主义的流动感。抛弃生硬的弹窗，采用如水波纹般晕开的软浮层 (Soft Glassmorphism) 展示底层的词元分析数据。

---

## 🏛️ 2. 核心功能模块 (Core Modules)

### 模块一：中西双语“镜像”书柜（已实现 · Reader 原型）

该能力已在前端实际落地为 `/studio` 的 `reader` 视图（组件：`src/components/MirrorBookshelf.tsx`）。

```text
进入 /studio
  -> Header 切换模块：reader
  -> MirrorBookshelf
       |-- 章节选择（Capítulo）
       |-- 译本选择（Translator dropdown）
       |-- 双语分栏
            |-- 左：中文原文（按 selectedWord 做字符高亮）
            |-- 右：西语译文（可点击“可对齐”词元）
       |-- 点击词元
            -> 在 taoData.wordAlignments 中按 (translator-chapter) 查找
            -> 命中则弹出词级对齐悬浮窗（中文/拼音/意义/句法功能）
       |-- 章节 AI 解析折叠条（展示 chapter.aiInterpretation）
```

说明（与 README 愿景对齐口径）：
* “动态对齐/词法分析”当前以 `taoData.ts` 的静态 `wordAlignments` 数据驱动（UI 与交互已跑通，但不是后端实时 NLP）。
* 章节解析（`chapter.aiInterpretation`）当前为静态内容并以折叠形式呈现。

### 模块二：多维 AI 认知与生成引擎（已实现 · 部分）

该能力已在前端实际落地为 `/studio` 的 `cognition` 视图（组件：`src/components/CognitionEngine.tsx`）。

```text
进入 /studio?module=cognition
  -> CognitionEngine
       |-- Tabs:
            | 1) Grafo de Conocimiento (知识图谱)
            | 2) 大道至简阁 (AI 对话)
            | 3) Vídeo Generativo (视频锚点，当前为 UI Mock)
```

1) 知识图谱（已实现渲染 · 静态数据）
* `src/components/KnowledgeGraph.tsx` 使用 SVG 进行节点/边渲染（来自 `src/data/taoData.ts` 的 `graphNodes/graphEdges`）。
* 鼠标 hover 节点/边时高亮相连关系（偏“展示型原型”）。

2) AI 对话（已实现 · 真请求 + 流式输出）
* 对话当前实现为 `src/components/PabellonChat.tsx`（不是 PersonaChat 组件）。
* 交互：顶部标签切换不同“场域”（Negocio / Equipo / Relaciones / Laboral / Educación），每个标签会组装对应的 system 提示（`systemExtra`）。
* 发送与渲染：
  * `fetch POST ${VITE_SUPABASE_URL}/functions/v1/chat`
  * 使用 SSE/流式响应：逐行解析 `data: ...` 中的 `delta.content`，实时把内容追加到最后一条 assistant 消息。
* 重要环境变量：`VITE_SUPABASE_URL`、`VITE_SUPABASE_PUBLISHABLE_KEY`。

3) 视频锚点（已实现 UI · 当前为 Mock）
* `CognitionEngine` 的 `video` tab：选择风格 + 展示“Mock player”，当前不生成真实视频内容。

补充：`src/components/PersonaChat.tsx` 组件目前存在，但在路由 `/studio` 中未作为主对话入口挂载（当前主入口为 PabellonChat）。

### 模块三：MBTI 悟道研究报告（已实现 · 静态数据可视化原型）

该能力通过模态框 `EnlightenmentReport` 实现（组件：`src/components/EnlightenmentReport.tsx`），由 `/studio` Header 的 “Informe de Iluminación” 按钮触发。

```text
点击 Header: Informe de Iluminación
  -> EnlightenmentReport modal
       |-- MBTI Card（mbtiData.type / label）
       |-- Wu Wei 对齐度（mbtiData.wuWeiAlignment）
       |-- RadarChart（recharts）
       |-- 维度条形（dimensions bars）
```

说明：当前报告内容基于 `src/data/taoData.ts` 的静态 `mbtiData`，尚未与对话内容/闯关进度进行实时联动推导。

### 附：闯关修道（已实现 · Mock 进度 + 测验原型）

模态框入口：`/studio` Header 的 “El Camino（闯关修道）”（组件：`src/components/ElCaminoDelTao.tsx`）。

```text
点击 Header: El Camino del Tao
  -> ElCaminoDelTao modal
       |-- 主路径：81章蛇形排列（demo: 解锁仅前3章）
       |-- 选章节 -> 进入关卡(levels)列表
       |-- 选 level -> 测验题（mock 题库）
       |-- 选择答案 -> 更新 score -> 推进下一题（动画节奏 800ms）
```

说明：
* 目前 `progress` 使用 `initialProgress` 演示态（`useState(initialProgress)`），因此“完成后解锁更多章节”主要体现为原型闭环，而非完整后端/存储驱动。

---
## 🌐 其它已实现产品体验（Homepage）

首页入口（`/`，组件：`src/pages/Homepage.tsx`）提供“内容浏览 + 快速进入工作台 + 辅助问答”的组合体验：

```text
Homepage "/"
  |-- Sticky Header
        |-- 搜索框（UI 交互）
             |-- 聚焦 -> 下拉：搜索历史（mock）+ 推荐搜索（mock）
             |-- 输入 -> 仅影响 UI 状态（当前未做真实搜索）
        |-- 入口按钮：
             |-- "Lectura" -> /studio
             |-- "Cognición IA" -> /studio?module=cognition
  |
  |-- Main：
        |-- Hero 轮播（自动每 5s 切换，图片资源本地 assets）
        |-- 经典书籍卡片网格（books mock）
        |-- 文化视频推荐卡片（videos mock，点击打开外链 bilibili）
  |
  |-- Right Sidebar（大屏显示：`hidden lg:block`）
        |-- 用户面板（登录仅使用本地状态 `loggedIn` 演示）
        |-- 智能问答：HomepageChat
```

### HomepageChat（已实现 · 真请求 + 流式输出）

`src/components/HomepageChat.tsx` 的“智能问答助手”实现了流式对话渲染：

```text
fetch POST ${VITE_SUPABASE_URL}/functions/v1/chat
Authorization: Bearer ${VITE_SUPABASE_PUBLISHABLE_KEY}
resp.body 使用 reader 逐行解析：
  仅提取 delta.content -> upsert 到最后一条 assistant 消息
```

### 说明（与愿景对齐口径）
* 首页的“搜索/历史/推荐搜索”当前主要是 UI 演示数据（在代码里是 mock 数组）。
* Persona 三人设（`src/components/PersonaChat.tsx`）目前未作为首页/Studio 主入口挂载；实际对话入口主要由 `PabellonChat` 与 `HomepageChat` 负责。

## 🛠️ 3. 技术落地建议（Technical Implementation Notes）

1. **路由与模块切换**
   * `src/App.tsx`：`/` -> `Homepage`，`/studio` -> `Index`
   * `src/pages/Index.tsx`：
     * `module=reader | cognition` 通过 `useSearchParams` 控制当前主模块

2. **前端栈**
   * UI：Tailwind CSS + 组件样式 className（`src/index.css` + 各组件）
   * 动效：`framer-motion`
   * 图表：`recharts`（MBTI 雷达图）

3. **数据层（当前原型的“数据真相”）**
   * `src/data/taoData.ts` 当前承载：
     * `chapters`（中文/译文/静态 aiInterpretation）
     * `wordAlignments`（静态词级对齐：spa-traductor + chapter number key）
     * `graphNodes/graphEdges`（知识图谱节点边）
     * `mbtiData`（MBTI 维度与对齐度）
     * `chatPersonas`（Persona Chat 的配置数据，当前未挂载为主入口）

4. **AI 对话接入（已实现 · 当前生效）**
   * Studio 对话入口：`src/components/PabellonChat.tsx`
   * 首页对话入口：`src/components/HomepageChat.tsx`
   * 统一请求地址：`POST ${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`
   * 统一流式解析方式：逐行解析 `data: ...`，提取 `choices[0].delta.content`

5. **下一步建议（与愿景对齐）**
   * 把 `wordAlignments` 从静态数据升级为后端对齐/词元分类服务（让“动态对齐”真正实时）。
   * 把 `ElCaminoDelTao` 的 `progress` 从演示态升级为真实可持久化进度，并与 `EnlightenmentReport` 生成参数联动。
   * 把 `CognitionEngine` 的 `video` tab 从 UI Mock 替换为真实“生成/播放”接口。
