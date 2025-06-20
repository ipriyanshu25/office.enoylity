"use client";

import React, { FC, useState, useEffect, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import { get, post } from "@/app/utils/apiClient";


type EmployeeInput = {
  empId: string;
  name: string;
  dob: string;
  dateOfJoining: string;
  department: string;
  designation: string;
  baseSalary: number;
  annualCtc: number;
  bankDetails: {
    bank_name: string;
    ifsc: string;
    account_number: string;
  };
  address: {
    line1: string;
    city: string;
    state: string;
    pin: string;
    cities: string[];
  };
  panCard: string;
  email: string;
  phone: string;
  adharnumber: string;
};

export default function AddEditEmployeePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeId = searchParams.get("employeeId");
  const isEdit = Boolean(employeeId);

  const [emp, setEmp] = useState<EmployeeInput>({
    empId: "",
    name: "",
    dob: "",
    dateOfJoining: "",
    department: "",
    designation: "",
    baseSalary: 0,
    annualCtc: 0,
    bankDetails: {
      bank_name: "",
      ifsc: "",
      account_number: "",
    },
    address: {
      line1: "",
      city: "",
      state: "",
      pin: "",
      cities: [],
    },
    panCard: "",
    email: "",
    phone: "",
    adharnumber: "",
  });

  // Fetch existing employee if editing
useEffect(() => {
    if (!isEdit) return;

    (async () => {
      try {
        const result = await get<{
          success: boolean;
          message?: string;
          data: { employee: any };
        }>('/employee/getrecord', { employeeId });

        if (result.success) {
          const e = result.data.employee;
          setEmp({
            empId: e.employeeId || "",
            name: e.name || "",
            dob: e.dob || "",
            dateOfJoining: e.date_of_joining || "",
            department: e.department || "",
            designation: e.designation || "",
            baseSalary: e.base_salary || 0,
            annualCtc: e.annual_salary || 0,
            bankDetails: {
              bank_name: e.bank_details.bank_name || "",
              ifsc: e.bank_details.ifsc || "",
              account_number: e.bank_details.account_number || "",
            },
            address: {
              line1: e.address.line1 || "",
              city: e.address.city || "",
              state: e.address.state || "",
              pin: e.address.pin || "",
              cities: e.address.cities || [],
            },
            panCard: e.pan_number || "",
            email: e.email || "",
            phone: e.phone || "",
            adharnumber: e.adharnumber || "",
          });
        } else {
          Swal.fire('Error', result.message || 'Could not load data', 'error');
          router.back();
        }
      } catch (err) {
        console.error(err);
        router.back();
      }
    })();
  }, [employeeId, isEdit, router]);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const payload = {
      employeeId: emp.empId,
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      dob: emp.dob,
      adharnumber: emp.adharnumber,
      pan_number: emp.panCard,
      date_of_joining: emp.dateOfJoining,
      annual_salary: emp.annualCtc,
      base_salary: emp.baseSalary,
      department: emp.department,
      designation: emp.designation,
      bank_details: {
        account_number: emp.bankDetails.account_number,
        ifsc: emp.bankDetails.ifsc,
        bank_name: emp.bankDetails.bank_name,
      },
      address: {
        line1: emp.address.line1,
        city: emp.address.city,
        state: emp.address.state,
        pin: emp.address.pin,
        cities: emp.address.cities,
      },
    };

    try {
      const endpoint = isEdit ? '/employee/update' : '/employee/SaveRecord';
      const result = await post<{ success: boolean; message?: string }>(
        endpoint,
        payload
      );

      if (result.success) {
        await Swal.fire({
          icon: 'success',
          title: isEdit ? 'Employee Updated' : 'Employee Added',
          timer: 1500,
          showConfirmButton: false,
        });
        router.push('/employee');
      } else {
        Swal.fire('Error', result.message || 'Operation failed', 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Please try again later', 'error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading form…</div>}>
      <div className="min-h-screen bg-indigo-100 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 mb-10">
          <h1 className="text-3xl font-semibold mb-6">{isEdit ? 'Edit' : 'Add'} Employee</h1>
          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-6">

            {/* Personal Info */}
            {/* Employee ID */}
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium mb-1">Employee Id</label>
              <input
                type="text"
                required
                value={emp.empId}
                onChange={(e) => setEmp({ ...emp, empId: e.target.value })}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 ${isEdit
                  ? 'bg-gray-100 opacity-50 pointer-events-none cursor-not-allowed' : ''}`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="w-full">
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={emp.name}
                  onChange={(e) => setEmp({ ...emp, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Email Address */}
              <div className="w-full">
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={emp.email}
                  onChange={(e) => setEmp({ ...emp, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={emp.phone}
                  onChange={(e) => setEmp({ ...emp, phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={emp.dob}
                  onChange={(e) => setEmp({ ...emp, dob: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Aadhar Number</label>
                <input
                  type="text"
                  required
                  value={emp.adharnumber || ""}
                  onChange={(e) => setEmp({ ...emp, adharnumber: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">PAN Card Number</label>
                <input
                  type="text"
                  required
                  value={emp.panCard}
                  onChange={(e) => setEmp({ ...emp, panCard: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Job Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={emp.department}
                  onChange={(e) => setEmp({ ...emp, department: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Designation</label>
                <input
                  type="text"
                  required
                  value={emp.designation}
                  onChange={(e) => setEmp({ ...emp, designation: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Joining Date</label>
                <input
                  type="date"
                  required
                  value={emp.dateOfJoining}
                  onChange={(e) => setEmp({ ...emp, dateOfJoining: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Salary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Base Salary */}
              <div>
                <label className="block text-sm font-medium mb-1">Base Salary</label>
                <input
                  type="number"
                  required
                  value={emp.baseSalary === 0 ? '' : emp.baseSalary}
                  onChange={e => {
                    const base = e.target.value === '' ? 0 : Number(e.target.value);
                    setEmp({
                      ...emp,
                      baseSalary: base,
                      annualCtc: base > 0 ? base * 12 : 0,
                    });
                  }}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Annual CTC (read‑only) */}
              <div>
                <label className="block text-sm font-medium mb-1">Annual CTC</label>
                <input
                  type="number"
                  required
                  readOnly
                  value={emp.annualCtc === 0 ? '' : emp.annualCtc}
                  className="w-full px-4 py-2 border bg-gray-100 rounded-md"
                />
              </div>
            </div>

            {/* Bank Details */}
            <div>
              <label className="block text-sm font-medium mb-2">Bank Details</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <input
                  type="text"
                  required
                  placeholder="Bank Name"
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                  value={emp.bankDetails.bank_name}
                  onChange={(e) => setEmp({ ...emp, bankDetails: { ...emp.bankDetails, bank_name: e.target.value } })}
                />
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                  placeholder="IFSC"
                  value={emp.bankDetails.ifsc}
                  onChange={(e) => setEmp({ ...emp, bankDetails: { ...emp.bankDetails, ifsc: e.target.value } })}
                />
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                  placeholder="Account Number"
                  value={emp.bankDetails.account_number}
                  onChange={(e) => setEmp({ ...emp, bankDetails: { ...emp.bankDetails, account_number: e.target.value } })}
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                  placeholder="Address Line 1"
                  value={emp.address.line1}
                  onChange={(e) => setEmp({ ...emp, address: { ...emp.address, line1: e.target.value } })}
                />
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                  placeholder="City"
                  value={emp.address.city}
                  onChange={(e) => setEmp({ ...emp, address: { ...emp.address, city: e.target.value } })}
                />
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                  placeholder="State"
                  value={emp.address.state}
                  onChange={(e) => setEmp({ ...emp, address: { ...emp.address, state: e.target.value } })}
                />
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                  placeholder="PIN Code"
                  value={emp.address.pin}
                  onChange={(e) => setEmp({ ...emp, address: { ...emp.address, pin: e.target.value } })}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link
                href="/employee"
                className="px-6 py-2 rounded-md border hover:bg-gray-100 text-sm"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </Suspense>
  );
}