"use client";

import React, {
  FC,
  useState,
  useCallback,
  useMemo,
  useEffect
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveAs } from "file-saver";
import Swal from 'sweetalert2';
import { postBlob, post } from "@/app/utils/apiClient";
import Link from "next/link";

interface Item {
  description: string;
  quantity: number;
  price: number;
}

interface InvoiceData {
  billDate: string;
  dueDate: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  clientPhone: string;
  paymentMethod: "" | "PayPal" | "Bank Transfer";
  items: Item[];
  notes: string;
  bankNote: string;
}

const initialItem: Item = { description: "", quantity: 1, price: 0 };
const initialData: InvoiceData = {
  billDate: "",
  dueDate: "",
  clientName: "",
  clientAddress: "",
  clientEmail: "",
  clientPhone: "",
  paymentMethod: "",
  items: [initialItem],
  notes: "",
  bankNote: "",
};

const ItemRow: FC<{
  item: Item;
  index: number;
  onChange: (index: number, field: keyof Item, value: string | number) => void;
  onRemove: (index: number) => void;
  disableRemove: boolean;
}> = React.memo(
  ({ item, index, onChange, onRemove, disableRemove }) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
      <label className="flex flex-col sm:col-span-2">
        <span>Description</span>
        <input
          type="text"
          name="description"
          value={item.description}
          onChange={(e) =>
            onChange(index, "description", e.target.value)
          }
          required
          className="mt-1 px-3 py-2 border rounded-lg"
        />
      </label>
      {!disableRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="px-3 py-2 bg-red-500 text-white rounded-lg"
        >
          Remove
        </button>
      )}
      <label className="flex flex-col">
        <span>Qty</span>
        <input
          type="number"
          name="quantity"
          min={1}
          value={item.quantity}
          onChange={(e) =>
            onChange(index, "quantity", Number(e.target.value))
          }
          className="mt-1 px-3 py-2 border rounded-lg"
        />
      </label>
      <label className="flex flex-col">
        <span>Price</span>
        <div className="mt-1 flex rounded-lg border overflow-hidden">
          <span className="px-3 py-2">$</span>
          <input
            type="number"
            name="price"
            min={0}
            step={0.01}
            value={item.price === 0 ? "" : item.price}
            onChange={(e) =>
              onChange(index, "price", e.target.value)
            }
            className="px-3 py-2 flex-1 outline-none"
          />
        </div>
      </label>
    </div>
  )
);

const GenerateInvoicePage: FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("id");
  const [data, setData] = useState<InvoiceData>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const convertDateToISO = (dateStr: string) => {
      if (!dateStr) return "";
      const [day, month, year] = dateStr.split("-");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    };

    const fetchInvoiceData = async () => {
      if (!invoiceId) return;

      try {
        const res = await post("/invoiceEnoylityLLC/getinvoice", { id: invoiceId });

        if (res?.success && res.data) {
          const invoice = res.data;

          setData({
            billDate: convertDateToISO(invoice.invoice_date) || "",
            dueDate: convertDateToISO(invoice.due_date) || "",
            clientName: invoice.bill_to?.name || "",
            clientAddress: invoice.bill_to?.address || "",
            clientEmail: invoice.bill_to?.email || "",
            clientPhone: invoice.bill_to?.bt_phone || "",
            paymentMethod:
              invoice.payment_method === 0
                ? "PayPal"
                : invoice.payment_method === 1
                  ? "Bank Transfer"
                  : "",
            items:
              Array.isArray(invoice.items) && invoice.items.length > 0
                ? invoice.items
                : [initialItem],
            notes: invoice.note || "",
            bankNote: invoice.bank_Note || "",
          });
        } else {
          console.warn("Failed to fetch invoice:", res?.message);
        }
      } catch (error) {
        console.error("Error fetching invoice data:", error);
      }
    };

    fetchInvoiceData();
  }, [invoiceId]);

  const handleFieldChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleItemChange = useCallback((index: number, field: keyof Item, value: string | number) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((it, i) =>
        i === index ? { ...it, [field]: field === "description" ? value : Number(value) } : it
      ),
    }));
  }, []);

  const addItem = useCallback(() => setData((prev) => ({
    ...prev,
    items: [...prev.items, initialItem],
  })), []);

  const removeItem = useCallback((index: number) => setData((prev) => ({
    ...prev,
    items: prev.items.filter((_, i) => i !== index),
  })), []);

  const formattedInvoiceDate = useMemo(() => {
    if (!data.billDate) return "";
    const d = new Date(data.billDate);
    return [
      d.getDate().toString().padStart(2, "0"),
      (d.getMonth() + 1).toString().padStart(2, "0"),
      d.getFullYear(),
    ].join("-");
  }, [data.billDate]);

  const formattedDueDate = useMemo(() => {
    if (!data.dueDate) return "";
    const d = new Date(data.dueDate);
    return [
      d.getDate().toString().padStart(2, "0"),
      (d.getMonth() + 1).toString().padStart(2, "0"),
      d.getFullYear(),
    ].join("-");
  }, [data.dueDate]);

  const isValid = useMemo(() =>
    !!data.billDate &&
    !!data.dueDate &&
    !!data.clientName &&
    !!data.clientAddress &&
    data.items.length > 0, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      await Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please fill all required fields.",
      });
      return;
    }

    const payload = {
      bill_to_name: data.clientName,
      bill_to_address: data.clientAddress,
      bill_to_phone: data.clientPhone,
      bill_to_email: data.clientEmail,
      invoice_date: formattedInvoiceDate,
      due_date: formattedDueDate,
      note: data.notes,
      items: data.items,
      payment_method:
        data.paymentMethod === "PayPal"
          ? 0
          : data.paymentMethod === "Bank Transfer"
            ? 1
            : 2,
      bank_Note: data.paymentMethod === "Bank Transfer" ? data.bankNote : "",
    };

    setIsLoading(true);
    try {
      const blob = await postBlob(
        "/invoiceEnoylityLLC/generate-invoice",
        payload
      );
      saveAs(blob, `invoice_${payload.bill_to_name}.pdf`);

      await Swal.fire({
        icon: "success",
        title: "Invoice Generated",
        text: "Your PDF has been downloaded.",
        timer: 1500,
        showConfirmButton: false,
      });

      router.push("/invoice/enoylitytech");
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Generation Failed",
        text: "There was an error generating your invoice. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-100 p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6 mb-12">
        <h1 className="text-2xl font-semibold mb-4">
          Generate Invoice for Enoylity Media Creations
        </h1>
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          className="space-y-4"
        >
          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(["billDate", "dueDate"] as const).map((field) => (
              <label key={field} className="flex flex-col">
                <span>
                  {field === "billDate" ? "Bill Date" : "Due Date"}
                </span>
                <input
                  type="date"
                  name={field}
                  value={data[field]}
                  onChange={handleFieldChange}
                  required
                  className="mt-1 px-3 py-2 border rounded-lg"
                />
              </label>
            ))}
          </div>

          {/* Client Info */}
          <div className="space-y-2">
            <h2 className="font-bold">Client Information</h2>
            {(
              ["clientName", "clientAddress", "clientEmail", "clientPhone"] as const
            ).map((field) => (
              <label key={field} className="flex flex-col">
                <span>
                  {{
                    clientName: "Name",
                    clientAddress: "Address",
                    clientEmail: "Email",
                    clientPhone: "Phone",
                  }[field]}
                </span>
                <input
                  type={
                    field === "clientEmail"
                      ? "email"
                      : field === "clientPhone"
                        ? "tel"
                        : "text"
                  }
                  name={field}
                  value={data[field]}
                  onChange={handleFieldChange}
                  className="mt-1 px-3 py-2 border rounded-lg"
                />
              </label>
            ))}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="flex flex-col">
              <span>Payment Method</span>
              <select
                name="paymentMethod"
                value={data.paymentMethod}
                onChange={handleFieldChange}
                className="mt-1 px-3 py-2 border rounded-lg"
              >
                <option value="" disabled>
                  Select Payment Method
                </option>
                <option value="PayPal">PayPal</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </label>

            {data.paymentMethod === "Bank Transfer" && (
              <label className="flex flex-col">
                <span>Bank Note</span>
                <input
                  type="text"
                  name="bankNote"
                  value={data.bankNote}
                  onChange={handleFieldChange}
                  className="mt-1 px-3 py-2 border rounded-lg"
                />
              </label>
            )}
          </div>

          {/* Items */}
          <div className="space-y-2">
            <h2 className="font-medium">Items</h2>
            {data.items.map((it, idx) => (
              <ItemRow
                key={idx}
                item={it}
                index={idx}
                onChange={handleItemChange}
                onRemove={removeItem}
                disableRemove={data.items.length <= 1}
              />
            ))}
            <button
              type="button"
              onClick={addItem}
              className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg"
            >
              Add Item
            </button>
          </div>

          {/* Notes */}
          <label className="flex flex-col">
            <span>Notes</span>
            <textarea
              name="notes"
              value={data.notes}
              onChange={handleFieldChange}
              className="mt-1 px-3 py-2 border rounded-lg"
              rows={3}
            />
          </label>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/invoice/enoylitytech"
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className={`px-4 py-2 rounded-lg text-white ${isValid && !isLoading
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-gray-400 cursor-not-allowed"
                }`}
            >
              {isLoading ? "Generating…" : "Generate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateInvoicePage;
