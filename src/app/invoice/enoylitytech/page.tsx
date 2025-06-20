"use client";

import React, { FC, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaSort,
  FaSortUp,
  FaSortDown,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaEdit,
} from "react-icons/fa";
import { post } from "@/app/utils/apiClient";

type Item = { description: string; quantity: number; price: number };
type Invoice = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  bill_to: { name: string; email: string; address: string; city: string };
  items: Item[];
  payment_method: number;
  total_amount: number;
};

const pageSize = 5;

type ListResp = {
  success: boolean;
  message?: string;
  data: {
    invoices: any[];
    total_pages: number;
  };
};

const InvoiceRow: FC<{
  invoice: Invoice;
  expanded: boolean;
  toggle: () => void;
  onCopy: () => void;
}> = React.memo(({ invoice, expanded, toggle, onCopy }) => (
  <>
    <tr className="border-t hover:bg-gray-50">
      <td className="px-3 py-2">{invoice.invoice_number}</td>
      <td className="px-3 py-2">{invoice.invoice_date}</td>
      <td className="px-3 py-2">{invoice.bill_to.name}</td>
      <td className="px-3 py-2">₹ {invoice.total_amount.toFixed(2)}</td>
      <td className="px-3 py-2">
        {invoice.payment_method === 0 ? "PayPal" : "Bank Transfer"}
      </td>
      <td className="px-3 py-2 flex items-center space-x-2">
        <button onClick={toggle}>
          {expanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>
        <button
          onClick={onCopy}
          className="px-3 py-1 text-green-600 rounded"
          title="Copy & Generate"
        >
          <FaEdit />
        </button>
      </td>
    </tr>
    {expanded && (
      <tr className="border-b bg-gray-50">
        <td colSpan={6} className="p-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-2 py-1 text-left">Description</th>
                  <th className="px-2 py-1">Qty</th>
                  <th className="px-2 py-1">Price</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((it, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1">{it.description}</td>
                    <td className="px-2 py-1 text-center">{it.quantity}</td>
                    <td className="px-2 py-1 text-right">
                      ₹ {it.price.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </td>
      </tr>
    )}
  </>
));

const InvoiceHistoryPage: FC = () => {
  const router = useRouter();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<keyof Invoice>("invoice_date");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, any>>({});

  useEffect(() => {
    setRole(localStorage.getItem("role"));
    setPermissions(JSON.parse(localStorage.getItem("permissions") || "{}"));
  }, []);

  const canView = useMemo(
    () => role === "admin" || permissions["View Invoice details"] === 1,
    [role, permissions]
  );

  const canGenerate = useMemo(
    () => role === "admin" || permissions["Generate invoice details"] === 1,
    [role, permissions]
  );

  const fetchInvoices = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError("");

    try {
      const params: any = {
        page,
        page_size: pageSize,
        sort_by: sortField,
        sort_order: sortAsc ? "asc" : "desc",
      };
      if (search) params.search = search;

      const result = await post<ListResp>("/invoiceEnoylityLLC/getlist", params);

      if (!result.success) {
        setError(result.message || "Failed to load invoices.");
      } else {
        const raw = result.data.invoices;
        const mapped: Invoice[] = raw.map((inv: any) => ({
          id: inv.invoiceenoylityId,
          invoice_number: inv.invoice_number,
          invoice_date: inv.invoice_date,
          due_date: inv.due_date,
          bill_to: inv.bill_to,
          items: inv.items,
          payment_method: inv.payment_method,
          total_amount: inv.total,
        }));
        setInvoices(mapped);
        setTotalPages(result.data.total_pages || 1);
      }
    } catch (e: any) {
      setError(e.message || "Network or server error.");
    } finally {
      setLoading(false);
    }
  }, [canView, page, search, sortField, sortAsc]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const onSort = (field: keyof Invoice) => {
    if (field === sortField) setSortAsc((p) => !p);
    else {
      setSortField(field);
      setSortAsc(true);
    }
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-indigo-100 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold mb-4">
          Enoylity Media Creations Invoice History
        </h1>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border rounded-lg w-full sm:w-64"
          />
          {canGenerate && (
            <Link
              href="/invoice/enoylitytech/generate"
              className="flex items-center px-5 py-2 bg-indigo-600 text-white rounded-lg mt-2 sm:mt-0"
            >
              <FaPlus className="mr-2" /> Generate
            </Link>
          )}
        </div>

        {error && <div className="text-red-500 text-center mb-4">{error}</div>}
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : !canView ? (
          <div className="text-center py-4 text-gray-600">
            You do not have permission to view invoices.
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-4 text-gray-600">No invoices found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead className="bg-gray-100">
                <tr>
                  {[
                    { key: "invoice_number", label: "#" },
                    { key: "invoice_date", label: "Date" },
                    { key: "bill_to.name", label: "Client" },
                    { key: "total_amount", label: "Total" },
                    { key: "payment_method", label: "Payment" },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      className="px-3 py-2 text-left cursor-pointer"
                      onClick={() => onSort(key as keyof Invoice)}
                    >
                      <div className="flex items-center">
                        {label}{" "}
                        {sortField === key ? (
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
                  ))}
                  <th className="px-3 py-2">Details</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <InvoiceRow
                    key={inv.id}
                    invoice={inv}
                    expanded={expandedId === inv.id}
                    toggle={() => toggleExpand(inv.id)}
                    onCopy={() =>
                      router.push(
                        `/invoice/enoylitytech/generate?id=${encodeURIComponent(inv.id)}`
                      )
                    }
                  />
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex justify-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-1 border rounded ${page === i + 1 ? "bg-indigo-200" : ""
                    }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceHistoryPage;
