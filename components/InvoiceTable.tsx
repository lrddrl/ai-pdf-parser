'use client';

import React, { useState } from 'react';
import useSWR from 'swr';

export type Invoice = {
  id: string;
  customerName: string;
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  lineItems: any;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function InvoiceTable() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Invoice>>({});

  const { data: invoices, error, mutate } = useSWR<Invoice[]>(
    '/api/invoices',
    fetcher
  );

  // Start editing a row
  const handleEdit = (invoice: Invoice) => {
    setEditingId(invoice.id);
    setEditData(invoice);
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  // Handle input change
  const handleChange = (field: keyof Invoice, value: string | number) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  // Save changes
  const handleSave = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        alert(`Update failed: ${errorData.error || res.statusText}`);
      } else {
        // Refresh list after successful update
        await mutate();
        setEditingId(null);
        setEditData({});
      }
    } catch (error) {
      console.error('Failed to update invoice:', error);
      alert('Failed to update invoice');
    }
  };

  if (error) return <div className="text-red-500">Failed to load invoice data</div>;
  if (!invoices) return <div>Loading invoice data...</div>;
  if (invoices.length === 0)
    return <div className="text-gray-500">No invoice data available. Please upload an invoice, one at a time.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="table-fixed w-full bg-white border">
        <thead>
          <tr>
            <th className="w-[80px] py-2 px-4 border">Actions</th>
            <th className="w-[150px] py-2 px-4 border">Customer Name</th>
            <th className="w-[150px] py-2 px-4 border">Vendor Name</th>
            <th className="w-[120px] py-2 px-4 border">Invoice Number</th>
            <th className="w-[120px] py-2 px-4 border">Invoice Date</th>
            <th className="w-[120px] py-2 px-4 border">Due Date</th>
            <th className="w-[80px] py-2 px-4 border">Amount</th>
            <th className="w-[200px] py-2 px-4 border">Line Items</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id}>
              {/* Actions column */}
              <td className="py-2 px-4 border">
                {editingId === inv.id ? (
                  <>
                    <button
                      className="text-blue-500 mr-2"
                      onClick={() => handleSave(inv.id)}
                    >
                      Save
                    </button>
                    <button className="text-gray-500" onClick={handleCancel}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button className="text-green-500" onClick={() => handleEdit(inv)}>
                    Edit
                  </button>
                )}
              </td>

              {/* Customer Name */}
              <td className="py-2 px-4 border">
                {editingId === inv.id ? (
                  <input
                    className="border rounded px-1 w-full"
                    type="text"
                    value={editData.customerName || ''}
                    onChange={(e) => handleChange('customerName', e.target.value)}
                  />
                ) : (
                  inv.customerName
                )}
              </td>

              {/* Vendor Name */}
              <td className="py-2 px-4 border">
                {editingId === inv.id ? (
                  <input
                    className="border rounded px-1 w-full"
                    type="text"
                    value={editData.vendorName || ''}
                    onChange={(e) => handleChange('vendorName', e.target.value)}
                  />
                ) : (
                  inv.vendorName
                )}
              </td>

              {/* Invoice Number */}
              <td className="py-2 px-4 border">
                {editingId === inv.id ? (
                  <input
                    className="border rounded px-1 w-full"
                    type="text"
                    value={editData.invoiceNumber || ''}
                    onChange={(e) =>
                      handleChange('invoiceNumber', e.target.value)
                    }
                  />
                ) : (
                  inv.invoiceNumber
                )}
              </td>

              {/* Invoice Date */}
              <td className="py-2 px-4 border">
                {editingId === inv.id ? (
                  <input
                    className="border rounded px-1 w-full"
                    type="date"
                    value={editData.invoiceDate || ''}
                    onChange={(e) => handleChange('invoiceDate', e.target.value)}
                  />
                ) : (
                  inv.invoiceDate
                )}
              </td>

              {/* Due Date */}
              <td className="py-2 px-4 border">
                {editingId === inv.id ? (
                  <input
                    className="border rounded px-1 w-full"
                    type="date"
                    value={editData.dueDate || ''}
                    onChange={(e) => handleChange('dueDate', e.target.value)}
                  />
                ) : (
                  inv.dueDate
                )}
              </td>

              {/* Amount */}
              <td className="py-2 px-4 border">
                {editingId === inv.id ? (
                  <input
                    className="border rounded px-1 w-full"
                    type="number"
                    value={editData.amount || 0}
                    onChange={(e) =>
                      handleChange('amount', Number(e.target.value))
                    }
                  />
                ) : (
                  inv.amount
                )}
              </td>

              {/* Line Items */}
              <td className="py-2 px-4 border w-[200px] whitespace-pre-wrap break-words">
                {JSON.stringify(inv.lineItems)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
