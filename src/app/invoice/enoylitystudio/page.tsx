"use client";

import React, { FC, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaSort,
  FaSortUp,
  FaSortDown,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaEdit
} from "react-icons/fa";
import { post } from "@/app/utils/apiClient";


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

type ListResp = {
  success: boolean;
  message?: string;
  data: {
    invoices: any[];
    total: number;
  };
};

const InvoiceHistoryPage: FC = () => {
  const router = useRouter();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<keyof Invoice>("invoice_date");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const perPage = 5;

  const role =
    typeof window !== "undefined" ? localStorage.getItem("role") : null;
  const permissions =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("permissions") || "{}")
      : {};

  const canViewInvoices =
    role === "admin" || permissions["View Invoice details"] === 1;
  const canGenerateInvoice =
    role === "admin" || permissions["Generate invoice details"] === 1;

  const fetchInvoices = useCallback(async () => {
    if (!canViewInvoices) return;

    setLoading(true);
    setError("");
    try {
      const result = await post<ListResp>("/invoiceEnoylity/getlist", {
        search,
        sortField,
        sortAsc,
        page,
        per_page: perPage,
      });

      if (!result.success) {
        setError(result.message || "Failed to load invoices.");
      } else {
        const raw = result.data.invoices;
        const parsed = raw.map((invoice: any): Invoice => ({
          id: invoice._id,
          invoice_number: invoice.invoice_number,
          invoice_date: invoice.invoice_date,
          due_date: invoice.due_date,
          bill_to: {
            name: invoice.client_name,
            email: invoice.client_email,
            address: invoice.client_address,
            city: invoice.client_city,
          },
          items: invoice.items,
          payment_method: invoice.payment_method,
          total_amount: invoice.total,
        }));
        setInvoices(parsed);
        setTotalPages(Math.ceil(result.data.total / perPage));
      }
    } catch (err: any) {
      setError(
        err.message ||
        (err.response?.data?.message
          ? err.response.data.message
          : "Network or server error.")
      );
    } finally {
      setLoading(false);
    }
  }, [search, sortField, sortAsc, page, canViewInvoices]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const toggleRow = (id: string) =>
    setExpandedRow((prev) => (prev === id ? null : id));

  const handleSort = (field: keyof Invoice) => {
    if (field === sortField) setSortAsc((prev) => !prev);
    else {
      setSortField(field);
      setSortAsc(true);
    }
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  const handleCopyToGenerate = (invoice: Invoice) => {
    router.push(
      `/invoice/enoylitystudio/generate?id=${encodeURIComponent(invoice.id)}`)
  };

  return (
    <div className="min-h-screen bg-indigo-100 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6 flex flex-col">
        <h1 className="text-2xl font-semibold mb-4">
          Enoylity Studio Invoice History
        </h1>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
          <input
            type="text"
            placeholder="Search by ID or client"
            value={search}
            onChange={handleSearchChange}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
          />
          {canGenerateInvoice && (
            <Link
              href="/invoice/enoylitystudio/generate"
              className="flex items-center px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <FaPlus className="mr-2" /> Generate Invoice
            </Link>
          )}
        </div>

        {/* Feedback */}
        {error && <div className="text-red-500 text-center mb-4">{error}</div>}
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : !canViewInvoices ? (
          <div className="text-center py-4 text-gray-600">
            You do not have permission to view invoices.
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-4 text-gray-600">
            No invoices found.
          </div>
        ) : (
          <>
            {/* Mobile */}
            <div className="sm:hidden">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-white p-4 mb-4 rounded-lg shadow"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-semibold">
                        {inv.invoice_number}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {inv.invoice_date}
                      </p>
                    </div>
                    <button onClick={() => toggleRow(inv.id)}>
                      {expandedRow === inv.id ? (
                        <FaChevronUp />
                      ) : (
                        <FaChevronDown />
                      )}
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
                    <div className="mt-3 space-y-2 text-sm">
                      <p>
                        <b>Client:</b> {inv.bill_to.name}
                      </p>
                      <p>
                        <b>Email:</b> {inv.bill_to.email}
                      </p>
                      <p>
                        <b>Total:</b> ₹ {inv.total_amount.toFixed(2)}
                      </p>
                      <p>
                        <b>Due:</b> {inv.due_date}
                      </p>
                      <p>
                        <b>Payment:</b>{" "}
                        {inv.payment_method === 0
                          ? "PayPal"
                          : "Bank Transfer"}
                      </p>
                      <p>
                        <b>Items:</b>
                      </p>
                      <table className="w-full text-xs border mt-1">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-2 py-1 text-left">
                              Description
                            </th>
                            <th className="px-2 py-1">Qty</th>
                            <th className="px-2 py-1">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inv.items.map((item, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="px-2 py-1">
                                {item.description}
                              </td>
                              <td className="px-2 py-1 text-center">
                                {item.quantity}
                              </td>
                              <td className="px-2 py-1 text-right">
                                ₹ {item.price.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead className="bg-gray-100">
                  <tr>
                    <th
                      className="px-3 py-2 text-left cursor-pointer"
                      onClick={() => handleSort("invoice_number")}
                    >
                      <div className="flex items-center">
                        Invoice Number{" "}
                        {sortField === "invoice_number" ? (
                          sortAsc ? (
                            <FaSortUp />
                          ) : (
                            <FaSortDown />
                          )
                        ) : (
                          <FaSort className="text-gray-400" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-3 py-2 text-left cursor-pointer"
                      onClick={() => handleSort("invoice_date")}
                    >
                      <div className="flex items-center">
                        Date{" "}
                        {sortField === "invoice_date" ? (
                          sortAsc ? (
                            <FaSortUp />
                          ) : (
                            <FaSortDown />
                          )
                        ) : (
                          <FaSort className="text-gray-400" />
                        )}
                      </div>
                    </th>
                    <th className="px-3 py-2">Client</th>
                    <th className="px-3 py-2">Total</th>
                    <th className="px-3 py-2">Payment</th>
                    <th className="px-3 py-2">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <React.Fragment key={inv.id}>
                      <tr className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2">{inv.invoice_number}</td>
                        <td className="px-3 py-2">{inv.invoice_date}</td>
                        <td className="px-3 py-2">{inv.bill_to.name}</td>
                        <td className="px-3 py-2">
                          ₹ {inv.total_amount.toFixed(2)}
                        </td>
                        <td className="px-3 py-2">
                          {inv.payment_method === 0
                            ? "PayPal"
                            : "Bank Transfer"}
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={() => toggleRow(inv.id)}>
                            {expandedRow === inv.id ? (
                              <FaChevronUp />
                            ) : (
                              <FaChevronDown />
                            )}
                          </button>
                          <button
                            onClick={() => handleCopyToGenerate(inv)}
                            className="px-3 text-green-600 hover:underline"
                            title="Copy & Generate"
                          >
                            <FaEdit />
                          </button>
                        </td>
                      </tr>
                      {expandedRow === inv.id && (
                        <tr className="border-b bg-gray-50">
                          <td colSpan={6}>
                            <div className="overflow-x-auto px-2 py-2">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-200">
                                  <tr>
                                    <th className="px-2 py-1 text-left">
                                      Description
                                    </th>
                                    <th className="px-2 py-1">Qty</th>
                                    <th className="px-2 py-1">Price</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {inv.items.map((item, idx) => (
                                    <tr key={idx} className="border-t">
                                      <td className="px-2 py-1">
                                        {item.description}
                                      </td>
                                      <td className="px-2 py-1 text-center">
                                        {item.quantity}
                                      </td>
                                      <td className="px-2 py-1 text-right">
                                        ₹ {item.price.toFixed(2)}
                                      </td>
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
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-center space-x-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-3 py-1 border rounded ${page === i + 1 ? "bg-indigo-200" : ""
                    }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InvoiceHistoryPage;
