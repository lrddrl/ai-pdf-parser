import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/app/(auth)/auth';
import { createWorker } from 'tesseract.js';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import { PDFDocument } from 'pdf-lib';

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

// Debug helper: log all resource keys of a page
function logPageResources(page) {
  const resources = page.node.get('Resources');
  if (resources) {
    console.log('Resources keys:', resources.keys());
  } else {
    console.log('No Resources found on page.');
  }
}

// A simple helper to extract the first image from a PDF page
function extractImageFromPage(page, pdfDoc) {
  const resources = page.node.get('Resources');
  if (!resources) return null;
  const xObject = resources.get('XObject');
  if (!xObject) return null;
  const keys = xObject.keys();
  for (const key of keys) {
    const xObjectRef = xObject.get(key);
    const xObjectObj = pdfDoc.context.lookup(xObjectRef);
    if (
      xObjectObj &&
      xObjectObj.dict &&
      xObjectObj.dict.get('Subtype')?.name === 'Image'
    ) {
      return Buffer.from(xObjectObj.getContents());
    }
  }
  return null;
}

export async function GET() {
  return NextResponse.json({ message: 'API route exists' });
}

export async function POST(request) {
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
        // First, try extracting text using pdf-parse
        const data = await pdf(finalBuffer);
        extractedText = data.text;
        console.log('Extracted text from PDF:', extractedText.substring(0, 300));

        // If no text is detected, assume the PDF is scanned and extract images using pdf-lib
        if (!extractedText.trim()) {
          console.log('No text detected. Attempting to extract images with pdf-lib...');
          const pdfDoc = await PDFDocument.load(finalBuffer);
          const pages = pdfDoc.getPages();
          let ocrResult = '';

          // Create the Tesseract worker using a manually specified workerPath
          // (This is the recommendation by Balearica)
          const worker = await createWorker(
            "eng",
            1,
            {
              workerPath: "./node_modules/tesseract.js/src/worker-script/node/index.js",
              logger: (m) => console.log("Tesseract:", m),
            }
          );

          // Loop through each page
          for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            // Log resources for debugging purposes
            logPageResources(page);
            const imageBuffer = extractImageFromPage(page, pdfDoc);
            if (imageBuffer) {
              console.log(`Performing OCR on image from page ${i + 1}...`);
              const { data: { text } } = await worker.recognize(imageBuffer);
              ocrResult += "\n" + text;
            } else {
              console.log(`No image found on page ${i + 1}.`);
            }
          }
          await worker.terminate();
          extractedText = ocrResult;
        }
      } catch (parseError: any) {
        console.error("PDF parsing error:", parseError);
        return NextResponse.json(
          { error: "Failed to parse PDF content: " + parseError.message },
          { status: 500 }
        );
      }
    } else {
      // For image files, perform OCR directly
      try {
        const worker = await createWorker(
          "eng",
          1,
          {
            workerPath: "./node_modules/tesseract.js/src/worker-script/node/index.js",
            logger: (m) => console.log("Tesseract:", m),
          }
        );
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

    // Check for rejection keywords
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
