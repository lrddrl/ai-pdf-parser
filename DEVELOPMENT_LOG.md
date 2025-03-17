# 更新日志

## [2.0] - 2025-03-17

### 新增/修复
- 修复图片识别问题：解决了上一个版本中无法识别图片的问题。
- 依赖更新说明：
  - 引入了能够识别图片的依赖：pdf-poppler 和 tesseract。
  - 注意：这两个依赖使用的是 CommonJS 环境，而 Next.js 的默认环境是 ES Module，需要特别留意模块兼容性问题。
- PDF 文字解析：
  - 如果需要解析 PDF 文字，务必使用以下导入方式：
    ```js
    import pdf from 'pdf-parse/lib/pdf-parse.js';
    ```
  - 这样可以确保 PDF 文字能够被正确解析。

### 注意事项
- 模块环境问题：由于 pdf-poppler 和 tesseract 属于 CommonJS 模块，请确保在 Next.js 中正确配置或采用兼容方案，以免出现运行时错误。
- 其他依赖目前不支持图片识别，请确保在项目中只针对需要识别图片的部分引入上述依赖。

---

# CHANGELOG

## [2.0] - 2025-03-17

### Added / Fixed
- Fixed image recognition issue: Resolved the problem where images could not be recognized in the previous version.
- Dependency Updates:
  - Added dependencies that support image recognition: pdf-poppler and tesseract.
  - Note: These dependencies operate in a CommonJS environment, whereas Next.js's default environment is ES Module. Please pay special attention to module compatibility issues.
- PDF Text Parsing:
  - If PDF text parsing is required, be sure to use the following import:
    ```js
    import pdf from 'pdf-parse/lib/pdf-parse.js';
    ```
  - This ensures that PDF text is parsed correctly.

### Remarks
- Module Environment Issues: Since pdf-poppler and tesseract are CommonJS modules, please ensure that Next.js is configured appropriately or a compatible approach is adopted to avoid runtime errors.
- Other dependencies do not support image recognition. Please ensure that only the above-mentioned dependencies are included in parts of the project that require image recognition.
