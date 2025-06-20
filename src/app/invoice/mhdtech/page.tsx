"use client";

import React, { FC, useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaSort, FaSortUp, FaSortDown, FaPlus, FaChevronDown, FaChevronUp, FaEdit } from 'react-icons/fa';
// ← import our shared helper
import { post } from '@/app/utils/apiClient';

type Item = {
  description: string;
  quantity: number;
  price: number;
};

type Invoice = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  bill_to: {
    name: string;
    email: string;
    address: string;
    city: string;
  };
  items: Item[];
  payment_method: number;
  total_amount: number;
};

type APIResponse = {
  success: boolean;
  message?: string;
  data: {
    invoices: any[];
    page: number;
    per_page: number;
    total: number;
  };
};

const InvoiceHistoryPage: FC = () => {
  const router = useRouter();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState<keyof Invoice>('invoice_date');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const perPage = 5;

  const role =
    typeof window !== 'undefined' ? localStorage.getItem('role') : null;
  const permissions =
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('permissions') || '{}')
      : {};

  const canViewInvoices =
    role === 'admin' || permissions['View Invoice details'] === 1;
  const canGenerateInvoice =
    role === 'admin' || permissions['Generate invoice details'] === 1;

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const payload = { search, filterStatus, sortField, sortAsc, page, perPage };
      const result = await post<APIResponse>('/invoiceMHD/getlist', payload);

      if (result.success && Array.isArray(result.data.invoices)) {
        const mapped = result.data.invoices.map((inv: any): Invoice => ({
          id: inv._id,
          invoice_number: inv.invoice_number,
          invoice_date: inv.invoice_date,
          due_date: inv.due_date,
          bill_to: inv.bill_to,
          items: inv.items,
          payment_method: inv.payment_method,
          total_amount: inv.total_amount,
        }));
        setInvoices(mapped);
      } else {
        setError(result.message || 'Unexpected response from server');
        console.warn('Unexpected response', result);
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err?.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, sortField, sortAsc, page]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const toggleRow = useCallback((id: string) => {
    setExpandedRow(prev => (prev === id ? null : id));
  }, []);

  const handleSort = useCallback(
    (field: keyof Invoice) => {
      if (field === sortField) {
        setSortAsc(prev => !prev);
      } else {
        setSortField(field);
        setSortAsc(true);
      }
      setPage(1);
    },
    [sortField]
  );

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const handlePage = useCallback((n: number) => setPage(n), []);

  const filtered = useMemo(() => {
    let arr = invoices;
    if (search) {
      const term = search.toLowerCase();
      arr = arr.filter(
        i =>
          i.id.toLowerCase().includes(term) ||
          i.bill_to.name.toLowerCase().includes(term)
      );
    }
    return [...arr].sort((a, b) => {
      const aVal = a[sortField] as any;
      const bVal = b[sortField] as any;
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [invoices, search, sortField, sortAsc]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData = filtered.slice((page - 1) * perPage, page * perPage);

  const handleCopyToGenerate = (invoice: Invoice) => {
    router.push(
      `/invoice/mhdtech/generate?id=${encodeURIComponent(invoice.id)}`)
  };

  return (
    <div className="min-h-screen bg-indigo-100 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6 flex flex-col">
        <h1 className="text-2xl font-semibold mb-4">MHD Tech Invoice History</h1>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:space-x-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by ID or client"
              value={search}
              onChange={handleSearch}
              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {canGenerateInvoice && (
            <Link
              href="/invoice/mhdtech/generate"
              className="flex items-center justify-center px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <FaPlus className="mr-2" /> Generate Invoice
            </Link>
          )}
        </div>

        {/* Error / Loading / Empty */}
        {error && <div className="text-red-500 text-center mb-4">{error}</div>}
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : !canViewInvoices ? (
          <div className="text-center py-4 text-gray-600">
            You do not have permission to view invoices.
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-4 text-gray-600">No invoices found.</div>
        ) : (
          <>
            {/* Mobile List */}
            <div className="sm:hidden">
              {pageData.map(inv => (
                <div key={inv.id} className="bg-white p-4 mb-4 rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-semibold">{inv.invoice_number}</h2>
                      <p className="text-sm text-gray-500">{inv.invoice_date}</p>
                    </div>
                    <button onClick={() => toggleRow(inv.id)}>
                      {expandedRow === inv.id ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                    <button
                      onClick={() => handleCopyToGenerate(inv)}
                      className="mt-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      title="Copy & Generate"
                    >
                      <FaEdit />
                    </button>

                  </div>
                  {expandedRow === inv.id && (
                    <div className="mt-3 space-y-2">
                      <p><span className="font-medium">Client:</span> {inv.bill_to.name}</p>
                      <p><span className="font-medium">Email:</span> {inv.bill_to.email}</p>
                      <p><span className="font-medium">Total:</span> ${inv.total_amount.toFixed(2)}</p>
                      <p><span className="font-medium">Due Date:</span> {inv.due_date}</p>
                      <p><span className="font-medium">Payment Method:</span> {inv.payment_method === 0 ? 'PayPal' : 'Bank Transfer'}</p>
                      <p className="font-medium">Items:</p>
                      <table className="w-full text-sm border">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-2 py-1 text-left">Description</th>
                            <th className="px-2 py-1">Qty</th>
                            <th className="px-2 py-1">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inv.items.map((item, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="px-2 py-1">{item.description}</td>
                              <td className="px-2 py-1 text-center">{item.quantity}</td>
                              <td className="px-2 py-1 text-right">${item.price.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto w-full">
              <table className="min-w-full bg-white border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left cursor-pointer" onClick={() => handleSort('invoice_number')}>
                      <div className="flex items-center">
                        Invoice Number {sortField === 'invoice_number' ? (sortAsc ? <FaSortUp /> : <FaSortDown />) : <FaSort className="text-gray-400" />}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left cursor-pointer" onClick={() => handleSort('invoice_date')}>
                      <div className="flex items-center">
                        Date {sortField === 'invoice_date' ? (sortAsc ? <FaSortUp /> : <FaSortDown />) : <FaSort className="text-gray-400" />}
                      </div>
                    </th>
                    <th className="px-3 py-2">Client</th>
                    <th className="px-3 py-2">Total</th>
                    <th className="px-3 py-2">Payment Method</th>
                    <th className="px-3 py-2">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map(inv => (
                    <React.Fragment key={inv.id}>
                      <tr className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap">{inv.invoice_number}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{inv.invoice_date}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{inv.bill_to.name}</td>
                        <td className="px-3 py-2 whitespace-nowrap">${inv.total_amount.toFixed(2)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{inv.payment_method === 0 ? 'PayPal' : 'Bank Transfer'}</td>
                        <td className="px-3 py-2 whitespace-nowrap space-x-2">
                          <button onClick={() => toggleRow(inv.id)} className="text-indigo-600 hover:underline">
                            {expandedRow === inv.id ? <FaChevronUp /> : <FaChevronDown />}
                          </button>
                          <button
                            onClick={() => handleCopyToGenerate(inv)}
                            className="text-green-600 hover:underline"
                            title="Copy & Generate"
                          >
                            <FaEdit />
                          </button>
                        </td>

                      </tr>
                      {expandedRow === inv.id && (
                        <tr className="border-b bg-gray-50">
                          <td colSpan={6} className="px-3 py-2">
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead className="bg-gray-200">
                                  <tr>
                                    <th className="px-2 py-1 text-left">Description</th>
                                    <th className="px-2 py-1">Qty</th>
                                    <th className="px-2 py-1">Price</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {inv.items.map((item, idx) => (
                                    <tr key={idx} className="border-t">
                                      <td className="px-2 py-1">{item.description}</td>
                                      <td className="px-2 py-1 text-center">{item.quantity}</td>
                                      <td className="px-2 py-1 text-right">${item.price.toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {!pageData.length && (
                    <tr><td colSpan={6} className="text-center py-4">No invoices found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        <div className="mt-4 flex justify-center flex-wrap">
          <button
            onClick={() => handlePage(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 border rounded-lg mx-1 disabled:opacity-50"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => handlePage(i + 1)}
              className={`px-3 py-1 border rounded-lg mx-1 ${page === i + 1 ? 'bg-indigo-600 text-white' : ''
                }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => handlePage(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded-lg mx-1 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceHistoryPage;
