"use client";

import React, { FC, useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import { post, postBlob } from "@/app/utils/apiClient";

interface Item {
    description: string;
    quantity: number;
    price: number;
}

const GenerateInvoiceClient: FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const invoiceId = searchParams.get("id");

    const [billDate, setBillDate] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [clientName, setClientName] = useState("");
    const [clientAddress, setClientAddress] = useState("");
    const [clientCity, setClientCity] = useState("");
    const [clientEmail, setClientEmail] = useState("");
    const [clientPhone, setClientPhone] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"" | "PayPal" | "Bank Transfer">("");
    const [bankName, setBankName] = useState("");
    const [bankAccount, setBankAccount] = useState("");
    const [items, setItems] = useState<Item[]>([{ description: "", quantity: 1, price: 0 }]);
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const convertToInputDate = (dateStr: string) => {
        const [day, month, year] = dateStr.split("-");
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        if (invoiceId) {
            const fetchInvoiceData = async () => {
                try {
                    const response = await post(`/invoiceEnoylity/getinvoice`, { id: invoiceId });
                    const data = response.data;

                    setBillDate(convertToInputDate(data.invoice_date));
                    setDueDate(convertToInputDate(data.due_date));
                    setClientName(data.client_name);
                    setClientAddress(data.client_address);
                    setClientCity(data.client_city);
                    setClientEmail(data.client_email);
                    setClientPhone(data.phone);
                    setPaymentMethod(data.payment_method === 0 ? "PayPal" : "Bank Transfer");
                    setBankName(data.bank_name);
                    setBankAccount(data.bank_account);
                    setItems(data.items);
                    setNotes(data.notes);
                } catch (error) {
                    console.error("Error fetching invoice data:", error);
                }
            };

            fetchInvoiceData();
        }
    }, [invoiceId]);

    const handleAddItem = useCallback(() => {
        setItems((prev) => [...prev, { description: "", quantity: 1, price: 0 }]);
    }, []);

    const handleRemoveItem = useCallback((index: number) => {
        setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
    }, []);

    const handleItemChange = useCallback(
        (index: number, field: keyof Item, value: string | number) => {
            setItems((prev) =>
                prev.map((it, i) =>
                    i === index
                        ? {
                            ...it,
                            [field]: field === "description" ? value : Number(value),
                        }
                        : it
                )
            );
        },
        []
    );

    const formattedInvoiceDate = useMemo(() => {
        if (!billDate) return "";
        const d = new Date(billDate);
        return [d.getDate().toString().padStart(2, "0"), (d.getMonth() + 1).toString().padStart(2, "0"), d.getFullYear()].join("-");
    }, [billDate]);

    const formattedDueDate = useMemo(() => {
        if (!dueDate) return "";
        const d = new Date(dueDate);
        return [d.getDate().toString().padStart(2, "0"), (d.getMonth() + 1).toString().padStart(2, "0"), d.getFullYear()].join("-");
    }, [dueDate]);

    const isValid = useMemo(
        () =>
            billDate &&
            dueDate &&
            clientName &&
            clientAddress &&
            paymentMethod &&
            items.length > 0 &&
            (paymentMethod !== "Bank Transfer" || (bankName && bankAccount)),
        [billDate, dueDate, clientName, clientAddress, paymentMethod, items, bankName, bankAccount]
    );

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
            invoice_date: formattedInvoiceDate,
            due_date: formattedDueDate,
            client_name: clientName,
            client_address: clientAddress,
            client_city: clientCity,
            client_email: clientEmail,
            phone: clientPhone,
            payment_method: paymentMethod === "PayPal" ? 0 : 1,
            bank_name: bankName,
            bank_account: bankAccount,
            items,
            notes,
        };

        setIsLoading(true);
        try {
            const blob = await postBlob("/invoiceEnoylity/generate-invoice", payload);
            saveAs(blob, `invoice_${payload.client_name}.pdf`);

            await Swal.fire({
                icon: "success",
                title: "Invoice Generated",
                text: "Your PDF has been downloaded.",
                timer: 1500,
                showConfirmButton: false,
            });

            router.push("/invoice/enoylitystudio");
        } catch (err) {
            console.error("Error generating invoice:", err);
            await Swal.fire({
                icon: "error",
                title: "Generation Failed",
                text: "There was an error generating your invoice. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
        if (e.key === "Enter") e.preventDefault();
    };

    return (
        <div className="min-h-screen bg-indigo-100 p-4">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6 mb-12">
                <h1 className="text-2xl font-semibold mb-4">Generate Invoice for Enoylity Studio</h1>
                <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4">
                    {/* Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="flex flex-col">
                            <span>Bill Date</span>
                            <input
                                type="date"
                                value={billDate}
                                onChange={(e) => setBillDate(e.target.value)}
                                required
                                className="mt-1 px-3 py-2 border rounded-lg"
                            />
                        </label>
                        <label className="flex flex-col">
                            <span>Due Date</span>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                required
                                className="mt-1 px-3 py-2 border rounded-lg"
                            />
                        </label>
                    </div>

                    {/* Client Info */}
                    <div className="space-y-2">
                        <h2 className="font-bold">Client Information</h2>
                        {[
                            { label: "Name", value: clientName, setter: setClientName, type: "text" },
                            { label: "Address", value: clientAddress, setter: setClientAddress, type: "text" },
                            { label: "City", value: clientCity, setter: setClientCity, type: "text" },
                            { label: "Email", value: clientEmail, setter: setClientEmail, type: "email" },
                            { label: "Phone", value: clientPhone, setter: setClientPhone, type: "tel" },
                        ].map(({ label, value, setter, type }) => (
                            <label key={label} className="flex flex-col">
                                <span>{label}</span>
                                <input
                                    type={type}
                                    value={value}
                                    onChange={(e) => setter(e.target.value)}
                                    className="mt-1 px-3 py-2 border rounded-lg"
                                />
                            </label>
                        ))}
                    </div>

                    {/* Payment Method */}
                    <label className="flex flex-col">
                        <span>Payment Method</span>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as any)}
                            required
                            className="mt-1 px-3 py-2 border rounded-lg"
                        >
                            <option value="" disabled>
                                Select Payment Method
                            </option>
                            <option value="PayPal">PayPal</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                    </label>

                    {/* Items */}
                    <div className="space-y-2">
                        <h2 className="font-medium">Items</h2>
                        {items.map((it, idx) => (
                            <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                                <label className="flex flex-col sm:col-span-2">
                                    <span>Description</span>
                                    <input
                                        type="text"
                                        value={it.description}
                                        onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                                        required
                                        className="mt-1 px-3 py-2 border rounded-lg"
                                    />
                                </label>
                                {items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(idx)}
                                        className="px-3 py-2 bg-red-500 text-white rounded-lg w-full"
                                    >
                                        Remove
                                    </button>
                                )}
                                <label className="flex flex-col">
                                    <span>Qty</span>
                                    <input

                                        type="number"
                                        min={1}
                                        value={it.quantity}
                                        onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                                        required
                                        className="mt-1 px-3 py-2 border rounded-lg"
                                    />
                                </label>
                                <label className="flex flex-col">
                                    <span>Price</span>
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={it.price}
                                        onChange={(e) => handleItemChange(idx, "price", e.target.value)}
                                        required
                                        className="mt-1 px-3 py-2 border rounded-lg"
                                    />
                                </label>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                        >
                            Add Item
                        </button>
                    </div>

                    {/* Bank Details (if Bank Transfer) */}
                    {paymentMethod === "Bank Transfer" && (
                        <div className="space-y-2">
                            <label className="flex flex-col">
                                <span>Bank Name</span>
                                <input
                                    type="text"
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    required={paymentMethod === "Bank Transfer"}
                                    className="mt-1 px-3 py-2 border rounded-lg"
                                />
                            </label>
                            <label className="flex flex-col">
                                <span>Bank Account</span>
                                <input
                                    type="text"
                                    value={bankAccount}
                                    onChange={(e) => setBankAccount(e.target.value)}
                                    required={paymentMethod === "Bank Transfer"}
                                    className="mt-1 px-3 py-2 border rounded-lg"
                                />
                            </label>
                        </div>
                    )}

                    {/* Notes */}
                    <label className="flex flex-col">
                        <span>Notes</span>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                            className="mt-1 px-3 py-2 border rounded-lg"
                        />
                    </label>

                    {/* Buttons */}
                    <div className="flex justify-between">
                        <Link
                            href="/invoice/enoylitystudio"
                            className="px-4 py-2 rounded-lg border border-gray-400 hover:bg-gray-100"
                        >
                            Back
                        </Link>
                        <button
                            type="submit"
                            disabled={!isValid || isLoading}
                            className={`px-6 py-2 rounded-lg text-white ${isValid && !isLoading ? "bg-indigo-600 hover:bg-indigo-700" : "bg-gray-400 cursor-not-allowed"
                                }`}
                        >
                            {isLoading ? "Generating..." : "Generate PDF"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GenerateInvoiceClient;