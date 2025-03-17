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
  - PDF Parsing Limitations:
    - If the PDF is text-based, it can be parsed normally.
    - If the PDF is a scanned image, it currently cannot be parsed because it requires additional dependencies (pdfjs-dist, node-canvas) along with the “Desktop -      development with C++” workload, which is essential for compiling native modules like node-canvas.
    - Due to limited computer configuration and slow performance, this issue is still under investigation.

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

### Sample Screenshots
Below are three example screenshots illustrating different states of the system:

No Invoices Uploaded![image](https://github.com/user-attachments/assets/0fa4afe1-3bc5-417c-a4f7-4aa4e37adb00)


The page shows “No invoice data available. Please upload an invoice, one at a time.”
A placeholder icon and a brief instruction are displayed to guide the user.

Invoice Uploaded![image](https://github.com/user-attachments/assets/c4fc95ac-ecb6-47d8-9aa4-e76b16f967ee)


The page now displays a table with extracted invoice information, including Customer Name, Vendor Name, Invoice Number, Invoice Date, and Due Date.
A JSON snippet below shows the raw extracted data.

Duplicate Invoice Detected![image](https://github.com/user-attachments/assets/7ec3236f-b8ea-4bf9-afd2-c7a1457942b7)


If the same invoice is uploaded again, the system detects it as a duplicate and returns a message stating that the invoice already exists.

### Token Usage Tracking (Bonus)
![image](https://github.com/user-attachments/assets/180177cf-7bc8-48f9-9f9a-828ea7a3c80b)


The system tracks the number of tokens used (both input and output) for each processed invoice, and calculates the average cost per invoice. This helps in understanding the cost efficiency of invoice processing.

Below is an example screenshot illustrating this feature:

> **Explanation:**  
> This screenshot demonstrates the token usage tracking feature. It displays the number of input tokens used for processing the invoice data, the output tokens generated in the AI response, and the corresponding cost. This information is aggregated to calculate the average processing cost per invoice.

---
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
- PDF 解析限制：
  - 如果 PDF 为文字格式，则可以正常解析。
  - 如果 PDF 为扫描的图片，目前无法解析，因为需要安装额外依赖（pdfjs-dist、node-canvas）以及必须安装 “Desktop development with C++” 工作负载，以编译 node-canvas 等依赖的原生模块。
  - 由于电脑配置不足且运行较为缓慢，此问题仍在寻找解决方案中。


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

### 示例截图
以下是三个示例截图，展示了系统的不同状态：

未上传发票![image](https://github.com/user-attachments/assets/894edf83-cc2f-40a1-afbe-ea83edf7b001)


页面显示“没有可用的发票数据。请一次上传一张发票。”

显示占位符图标和简短说明以指导用户。

发票已上传 ![image](https://github.com/user-attachments/assets/a0a741a2-110a-48a2-9fcf-9ddd6d1e3658)


页面现在显示一个表格，其中包含提取的发票信息，包括客户名称、供应商名称、发票编号、发票日期和到期日。
下面的 JSON 片段显示了原始提取的数据。

检测到重复发票 ![image](https://github.com/user-attachments/assets/4b06bca0-0796-456a-baf5-b2d9ffb9b158)


如果再次上传同一张发票，系统会将其检测为重复发票并返回一条消息，说明发票已存在。

### Token 用量追踪（Bonus）
![image](https://github.com/user-attachments/assets/b1baf8c4-3d50-4718-9f6d-b7bce3be75e8)

系统会跟踪每次处理发票所使用的输入和输出 token 数量，并计算每张发票的平均处理成本，从而帮助我们了解发票处理的成本效率。

下图展示了该功能的示例界面：
> **说明：**  
> 该截图展示了 Token 用量追踪功能。图中显示了处理发票数据时使用的输入 token 数量、生成 AI 响应时的输出 token 数量，以及对应的费用信息。系统会将这些数据汇总，用以计算单张发票的平均成本。
