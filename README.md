# Invoice Processing & AI Conversational System

## 1. Requirements ✅

- [x] **Invoice Upload**  
  - Support for company admins to upload vendor invoices (PDF or image format).

- [x] **AI Information Extraction**  
  - Use AI to automatically extract key fields:
    - Customer name
    - Vendor name
    - Invoice number
    - Invoice date
    - Due date
    - Amount
    - Line items

- [x] **Data Storage**  
  - Save the extracted invoice information to the database.

- [x] **Document Validation**  
  - Prevent admins from uploading non-invoice documents (e.g., receipts, account statements).

- [x] **Data Display**  
  - Display a table of processed invoices showing key information.
  - Support sorting by date, amount, and vendor.
  - Allow admins to edit AI-extracted information if necessary.

- [x] **Duplicate Invoice Detection (Bonus)**  
  - Detect and prevent duplicate invoices from the same vendor using AI (based on invoice number, amount, etc.).

- [x] **Token Usage Tracking (Bonus)**  
  - Track token usage for each processed invoice and calculate the average cost per invoice.

- [x] **Prompt Caching (Bonus)**  
  - Implement prompt caching to record and optimize the number of input tokens.

## 2. Known Issues & Future Work

- **Current Limitations:**  
  - Only one invoice can be uploaded at a time.
  - After each upload, the page must be refreshed manually to allow another upload.

- **Future Improvements:**  
  - Support multiple invoice uploads in a single session.
  - Enhance the upload process to avoid manual page refresh after each upload, subject to time and requirements.

## 3. Project Overview & Setup

### Project Overview

This project implements a conversational interface where company admins can upload vendor invoices and use an AI agent to automatically extract, validate, and manage invoice information. The project is built on the following technology stack:

- **Frontend:** Next.js, Shadcn UI, Tailwind CSS
- **Backend:** Next.js API Routes, SQLite database
- **LLM:** OpenAI GPT-4o / Claude 3.5 Sonnet (configurable)
- **Agent Framework:** Vercel AI SDK

### Dependencies

- **Next.js**
- **Shadcn UI**
- **Tailwind CSS**
- **SQLite**
- **Vercel AI SDK**
- Other dependencies are listed in `package.json`.

### Setup Instructions

1. **Install Dependencies**  
   Run the following command in the project root:
   ```bash
   npm install


# 发票处理与 AI 对话系统

## 1. 项目要求 ✅

### 上传发票
- 支持公司管理员上传供应商发票（PDF 或图片格式）。

### AI 信息提取
- 使用 AI 自动提取关键字段：
  - 客户名称
  - 供应商名称
  - 发票号码
  - 发票日期
  - 到期日期
  - 金额
  - 费用明细

### 数据存储
- 将提取后的发票信息保存到数据库中。

### 文档验证
- 防止管理员上传非发票文件（如收据、账单）。

### 数据展示
- 显示已处理发票的表格，包含关键字段信息。
- 支持按日期、金额和供应商排序。
- 允许管理员在必要时编辑 AI 提取的信息。

### 重复发票检测（Bonus）
- 通过 AI 检测，防止同一供应商上传相同发票（基于发票号码、金额等）。

### Token 用量追踪（Bonus）
- 跟踪每次发票处理的 token 用量，并计算平均处理成本。

### Prompt 缓存（Bonus）
- 实现 prompt 缓存，记录并优化输入 token 数量。

---

## 2. 注意事项及后续工作

### 当前限制
- 目前版本每次只能上传一张发票。
- 每次上传后需要手动刷新页面才能进行下一次上传。

### 后续改进计划
- 支持一次上传多张发票。
- 优化上传流程，避免每次上传后必须手动刷新页面（视时间及需求而定）。

---

## 3. 项目介绍与启动指南

### 项目介绍
本项目实现了一个对话式界面，供公司管理员上传供应商发票，并通过 AI 自动提取、校验和管理发票信息。项目基于以下技术栈：
- **前端**：Next.js、Shadcn UI、Tailwind CSS
- **后端**：Next.js API 路由、SQLite 数据库
- **大语言模型**：OpenAI GPT-4o / Claude 3.5 Sonnet（可配置）
- **代理框架**：Vercel AI SDK

### 依赖
- Next.js
- Shadcn UI
- Tailwind CSS
- SQLite
- Vercel AI SDK
- （其他依赖请查看 `package.json` 文件）

### 启动指南

#### 安装依赖
在项目根目录下运行：
```bash
npm install
