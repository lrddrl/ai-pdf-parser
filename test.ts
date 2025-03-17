import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/app/(auth)/auth';
import { createWorker } from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';
import pdf from 'pdf-parse/lib/pdf-parse.js';

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
  if (request.body === null) {
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
        // Load the PDF using pdf-lib
        const pdfDoc = await PDFDocument.load(finalBuffer);
        const pages = pdfDoc.getPages();
        let ocrText = '';

        // Create a Tesseract worker for OCR
        const worker = createWorker({
          logger: (m) => console.log('Tesseract:', m),
        });
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');

        // Loop through each page in the PDF
        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          // Access the page's Resources dictionary
          const resources = page.node.get('Resources');
          if (!resources) {
            console.log(`No resources found on page ${i + 1}.`);
            continue;
          }
          // Get the XObject dictionary which may contain images
          const xObject = resources.get('XObject');
          if (!xObject) {
            console.log(`No XObject found on page ${i + 1}.`);
            continue;
          }
          // Iterate through each key in the XObject dictionary
          const xObjectKeys = xObject.keys();
          for (const key of xObjectKeys) {
            const xObjectRef = xObject.get(key);
            const xObjectObj = pdfDoc.context.lookup(xObjectRef);
            if (
              xObjectObj &&
              xObjectObj.dict &&
              xObjectObj.dict.get('Subtype') &&
              xObjectObj.dict.get('Subtype').name === 'Image'
            ) {
              // Extract the image bytes from the XObject stream.
              // The getContents() method returns a Uint8Array.
              const imageBytes = xObjectObj.getContents();
              const imageBuffer = Buffer.from(imageBytes);
              console.log(`Performing OCR on page ${i + 1}, image ${key}...`);
              const {
                data: { text },
              } = await worker.recognize(imageBuffer);
              ocrText += '\n' + text;
            }
          }
        }
        await worker.terminate();
        extractedText = ocrText;
      } catch (error: any) {
        console.error('PDF image extraction error:', error);
        return NextResponse.json(
          { error: 'Failed to extract images from PDF: ' + error.message },
          { status: 500 }
        );
      }
    } else {
      try {
        // For image files, perform OCR directly
        const worker = createWorker({
          logger: (m) => console.log('Tesseract:', m),
        });
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        const {
          data: { text },
        } = await worker.recognize(finalBuffer);
        extractedText = text;
        await worker.terminate();
      } catch (ocrError: any) {
        console.error('OCR error:', ocrError);
        return NextResponse.json(
          { error: 'Image OCR recognition failed: ' + ocrError.message },
          { status: 500 }
        );
      }
    }

    // Check if the extracted text contains keywords that indicate a rejected file type (e.g., receipts)
    const rejectionKeywords = ['receipt', 'account statement'];
    const isRejectedFile = rejectionKeywords.some((keyword) =>
      extractedText.toLowerCase().includes(keyword)
    );
    if (isRejectedFile) {
      return NextResponse.json(
        {
          error:
            'The uploaded file appears to be a receipt or account statement, which is not allowed.',
        },
        { status: 400 }
      );
    }

    let dataURL = '';
    if (file.type === 'application/pdf') {
      const host = request.headers.get('host');
      const protocol = host?.includes('localhost') ? 'http' : 'https';
      dataURL = `${protocol}://${host}/static/pdf-thumbnail.png`;
    } else {
      dataURL = `data:${file.type};base64,${finalBuffer.toString('base64')}`;
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
    console.error('Request processing failed:', error);
    return NextResponse.json(
      { error: 'Request processing failed: ' + error.message },
      { status: 500 }
    );
  }
}
