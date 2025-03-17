// app/api/invoices/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Please ensure that you have correctly exported the db object
import { invoice } from '@/lib/db/schema';
import { asc, desc } from 'drizzle-orm';

// GET /api/invoices?sortField=invoiceDate&sortOrder=asc
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sortField = searchParams.get('sortField') || 'invoiceDate';
  const sortOrder = searchParams.get('sortOrder') || 'asc';

  // Determine the sorting field based on sortField; supports invoiceDate, amount, vendorName
  let orderBy;
  if (sortField === 'amount') {
    orderBy = sortOrder === 'asc' ? asc(invoice.amount) : desc(invoice.amount);
  } else if (sortField === 'vendorName') {
    orderBy = sortOrder === 'asc' ? asc(invoice.vendorName) : desc(invoice.vendorName);
  } else {
    // Default sorting by invoice date
    orderBy = sortOrder === 'asc' ? asc(invoice.invoiceDate) : desc(invoice.invoiceDate);
  }

  // Query all invoice records and sort them
  const invoices = await db.select().from(invoice).orderBy(orderBy).all();
  return NextResponse.json(invoices);
}
