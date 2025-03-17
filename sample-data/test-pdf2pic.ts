const Poppler = require("pdf-poppler");
const fs = require("fs");
const path = require("path");
const Tesseract = require("tesseract.js");

async function testPdfPoppler(pdfPath: string, density: number = 300): Promise<void> {
  try {
    // 输出目录，用于保存转换后的图片
    const outputDir: string = path.join(__dirname, "output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // 构造输出文件前缀（例如 '7072948'）
    const pdfBaseName: string = path.basename(pdfPath, path.extname(pdfPath));

    // 设置转换选项，pdf-poppler 内部调用 pdftoppm 进行转换
    const opts = {
      format: 'png',
      out_dir: outputDir,
      out_prefix: pdfBaseName,
      page: 1
    };

    console.log("Converting PDF page 1 to image using pdf-poppler...");
    await Poppler.convert(pdfPath, opts);

    // 构造转换后图片的文件名，pdf-poppler 默认格式为 <prefix>-<page>.png
    const outputFile: string = path.join(outputDir, `${pdfBaseName}-1.png`);
    if (!fs.existsSync(outputFile)) {
      console.error("Converted file not found:", outputFile);
      return;
    }
    const imageBuffer: Buffer = fs.readFileSync(outputFile);
    console.log(`Converted image Buffer Length: ${imageBuffer.length}`);

    if (imageBuffer.length === 0) {
      console.warn("Converted image buffer is empty. The PDF conversion may have failed.");
      return;
    }

    // 使用 Tesseract.js 对图片 Buffer 进行 OCR 识别
    const { data: { text } } = await Tesseract.recognize(
      imageBuffer,
      'eng',
      { logger: (m: any) => console.log("Tesseract:", m) }
    );
    console.log("OCR Extracted Text:", text);

    // 可选：删除生成的图片文件
    // fs.unlinkSync(outputFile);
  } catch (error) {
    console.error("Error:", error);
  }
}

// ----- 脚本执行部分 -----
// 假设 PDF 文件名为 "7072948.pdf"，且与脚本在同一目录下
const pdfFileName: string = "7072948.pdf";
const pdfPath: string = path.join(__dirname, pdfFileName);

testPdfPoppler(pdfPath);
