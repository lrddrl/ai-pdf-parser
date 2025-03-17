import { createRequire } from 'module';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/app/(auth)/auth';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

const require = createRequire(import.meta.url);
const Poppler = require('pdf-poppler');

// Attempt to get the worker script path for Tesseract.js
let workerPath: string;
try {
  workerPath = require.resolve('tesseract.js/src/worker/worker-script/node/index.js');
  console.log("Using worker path:", workerPath);
} catch (err) {
  console.warn("Default worker path not found via require.resolve:", err);
  // Try to manually construct the path
  const manualPath = path.join(process.cwd(), 'node_modules', 'tesseract.js', 'src', 'worker', 'worker-script', 'node', 'index.js');
  if (fs.existsSync(manualPath)) {
    workerPath = manualPath;
    console.log("Using manually resolved worker path:", workerPath);
  } else {
    // Finally, use the fallback dist version
    workerPath = require.resolve('tesseract.js/dist/worker.min.js');
    console.log("Using fallback worker path:", workerPath);
  }
}

// Get the path for the Tesseract.js core wasm file
let corePath: string;
try {
  corePath = require.resolve('tesseract.js-core/tesseract-core.wasm.js');
  console.log("Using corePath:", corePath);
} catch (err) {
  console.error("Failed to resolve corePath for tesseract.js-core", err);
  throw err;
}

// Schema validation for the uploaded file
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: 'File size must not exceed 5MB',
    })
    .refine(
      (file) =>
        ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type),
      {
        message: 'File type must be JPEG, PNG, or PDF',
      }
    ),
});

export async function GET() {
  return NextResponse.json({ message: 'API route exists' });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!request.body) {
    return new Response('Request body is empty', { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    const validatedFile = FileSchema.safeParse({ file });
    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(', ');
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const filename = (formData.get('file') as File).name;
    const arrayBuffer = await file.arrayBuffer();
    const finalBuffer = Buffer.from(arrayBuffer);
    let extractedText = '';

    if (file.type === 'application/pdf') {
      try {
        // 1. Try to extract text from the PDF using pdf-parse
        const data = await pdf(finalBuffer);
        extractedText = data.text;
        console.log('Extracted text from PDF:', extractedText.substring(0, 300));

        // 2. If no text is detected, assume the PDF might be a scanned document,
        // then convert it to an image using pdf-poppler for OCR
        if (!extractedText.trim()) {
          console.log('No text detected. Converting PDF to image using pdf-poppler for OCR...');

          // Write the PDF Buffer to a temporary file
          const tempPdfPath = path.join(os.tmpdir(), `${Date.now()}-temp.pdf`);
          fs.writeFileSync(tempPdfPath, finalBuffer);

          // Set the output directory (in the temporary directory)
          const outputDir = path.join(os.tmpdir(), 'pdf-ocr-output');
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }
          const pdfBaseName = path.basename(tempPdfPath, path.extname(tempPdfPath));
          const opts = {
            format: 'png',
            out_dir: outputDir,
            out_prefix: pdfBaseName,
            page: 1,
          };

          await Poppler.convert(tempPdfPath, opts);

          // pdf-poppler by default generates a file named <prefix>-1.png
          const imagePath = path.join(outputDir, `${pdfBaseName}-1.png`);
          if (!fs.existsSync(imagePath)) {
            console.error("Converted file not found:", imagePath);
            return NextResponse.json(
              { error: "Failed to convert PDF to image." },
              { status: 500 }
            );
          }
          const imageBuffer = fs.readFileSync(imagePath);
          console.log(`Converted image Buffer Length: ${imageBuffer.length}`);
          if (imageBuffer.length === 0) {
            console.warn("Converted image buffer is empty.");
            return NextResponse.json(
              { error: "PDF to image conversion produced an empty result." },
              { status: 500 }
            );
          }

          // Dynamically import and load Tesseract.js with language parameter along with workerPath and corePath
          const { createWorker } = await import('tesseract.js');
          const worker = await createWorker('eng', { workerPath, corePath });
          await worker.load();
          const { data: { text } } = await worker.recognize(imageBuffer);
          console.log("OCR Extracted Text:", text);
          await worker.terminate();
          extractedText = text;

          // Clean up temporary files
          fs.unlinkSync(tempPdfPath);
          fs.unlinkSync(imagePath);
        }
      } catch (parseError: any) {
        console.error("PDF parsing error:", parseError);
        return NextResponse.json(
          { error: "Failed to parse PDF content: " + parseError.message },
          { status: 500 }
        );
      }
    } else {
      // For JPEG and PNG images, perform OCR directly
      try {
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('eng', { workerPath, corePath });
        await worker.load();
        const { data: { text } } = await worker.recognize(finalBuffer);
        extractedText = text;
        await worker.terminate();
      } catch (ocrError: any) {
        console.error("OCR error:", ocrError);
        return NextResponse.json(
          { error: "Image OCR recognition failed: " + ocrError.message },
          { status: 500 }
        );
      }
    }

    // Check if the extracted text contains any disallowed keywords
    const rejectionKeywords = ["receipt", "account statement"];
    if (rejectionKeywords.some((keyword) => extractedText.toLowerCase().includes(keyword))) {
      return NextResponse.json(
        {
          error:
            "The uploaded file appears to be a receipt or account statement, which is not allowed.",
        },
        { status: 400 }
      );
    }

    let dataURL = "";
    if (file.type === "application/pdf") {
      const host = request.headers.get("host");
      const protocol = host?.includes("localhost") ? "http" : "https";
      dataURL = `${protocol}://${host}/static/pdf-thumbnail.png`;
    } else {
      dataURL = `data:${file.type};base64,${finalBuffer.toString("base64")}`;
    }

    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${filename}`;

    return NextResponse.json({
      url: dataURL,
      pathname: `/uploads/${uniqueFilename}`,
      contentType: file.type,
      extractedText,
    });
  } catch (error: any) {
    console.error("Request processing failed:", error);
    return NextResponse.json(
      { error: "Request processing failed: " + error.message },
      { status: 500 }
    );
  }
}
