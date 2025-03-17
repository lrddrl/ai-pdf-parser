// app/api/invoices/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invoice } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/invoices/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: invoiceId } = await params;
  // Query the invoice record with the specified id
  const [foundInvoice] = await db
    .select()
    .from(invoice)
    .where(eq(invoice.id, invoiceId))
    .all();

  if (!foundInvoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }
  return NextResponse.json(foundInvoice);
}

// PUT /api/invoices/[id]
// Used to update invoice data; the front end submits the updated data
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: invoiceId } = await params;
  const body = await request.json();

  try {
    await db
      .update(invoice)
      .set({
        customerName: body.customerName,
        vendorName: body.vendorName,
        invoiceNumber: body.invoiceNumber,
        invoiceDate: body.invoiceDate,
        dueDate: body.dueDate || null,
        amount: body.amount, // Ensure that a numeric type is passed from the front end
        lineItems: body.lineItems, // Data in JSON format
      })
      .where(eq(invoice.id, invoiceId))
      .run();

    // Return the updated invoice data
    const [updatedInvoice] = await db
      .select()
      .from(invoice)
      .where(eq(invoice.id, invoiceId))
      .all();
    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('Failed to update invoice:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
