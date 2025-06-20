"use client";

import React, { FC, useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { postBlob, post, get } from "@/app/utils/apiClient";  // <-- shared helpers

interface BankDetails {
  account_number: string;
  [key: string]: any;
}

interface Employee {
  employeeId: string;
  name: string;
  email: string;
  dob: string;
  pan_number: string;
  date_of_joining: string;
  designation: string;
  department: string;
  bank_details?: BankDetails;
  base_salary: number;
}

interface SalaryComponent {
  name: string;
  amount: number;
}

const GeneratePayslip: FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const payslipId = searchParams.get('id');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [form, setForm] = useState<Record<string, string>>({
    basic: "",
    hra: "",
    overtime: "",
    bonus: "",
    lop: "",
    others: "",
  });
  const [tds, setTds] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch employee list once
  useEffect(() => {
    (async () => {
      try {
        const result = await post<{ success: boolean; data: { employees: Employee[] } }>(
          "/employee/getlist",
          { page: 1, pageSize: 100 }
        );
        if (result.success) setEmployees(result.data.employees);
        else throw new Error("Failed to load employees");
      } catch (err: any) {
        console.error(err);
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: err.message || "Could not fetch employees.",
        });
      }
    })();
  }, []);

  useEffect(() => {
    if (!payslipId) return;
    (async () => {
      setIsLoading(true);
      try {
        const resp = await get<{ success: boolean; data: { payslip: any }; message: string }>(
          `/employee/getpayslip?payslipId=${payslipId}`
        );
        if (!resp.success) throw new Error(resp.message || 'Failed to load payslip');

        const payslip = resp.data.payslip;
        // Employee lookup
        const emp = employees.find(e => e.employeeId === payslip.employeeId);
        if (emp) setSelectedEmployee(emp);

        // Month & year
        const monthName = payslip.month;
        const yearNum = payslip.year;
        const monthNum = String(new Date(`${monthName} 1, ${yearNum}`).getMonth() + 1).padStart(2, '0');
        setSelectedMonth(monthNum);
        setSelectedYear(String(yearNum));
        setTds(String(payslip.emp_snapshot['Tax Deduction at Source (TDS)'] || 0));

        // Populate salary components
        const compMap: Record<string, string> = {};
        payslip.salary_structure.forEach((comp: any) => {
          switch (comp.name) {
            case 'Basic Pay': compMap.basic = String(comp.amount); break;
            case 'House Rent Allowance': compMap.hra = String(comp.amount); break;
            case 'Overtime Bonus': compMap.overtime = String(comp.amount); break;
            case 'Performance Bonus': compMap.bonus = String(comp.amount); break;
            case 'Special Allowance': compMap.others = String(comp.amount); break;
          }
        });
        compMap.lop = String(payslip.lop_days ?? 0);
        setForm(compMap);
      } catch (err: any) {
        console.error(err);
        await Swal.fire({ icon: 'error', title: 'Load Failed', text: err.message });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [payslipId, employees]);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleSubmit = async () => {
    // Basic validation
    if (!selectedEmployee || !selectedMonth || !selectedYear) {
      await Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please select employee, month, and year.",
      });
      return;
    }

    // Prepare payload
    const todayStr = new Date().toLocaleDateString("en-GB");

    const salary_structure: SalaryComponent[] = [
      { name: "Basic Pay", amount: parseFloat(form.basic) || 0 },
      { name: "House Rent Allowance", amount: parseFloat(form.hra) || 0 },
      { name: "Overtime Bonus", amount: parseFloat(form.overtime) || 0 },
      { name: "Performance Bonus", amount: parseFloat(form.bonus) || 0 },
      { name: "Special Allowance", amount: parseFloat(form.others) || 0 },
    ];

    const payload = {
      employee_id: selectedEmployee.employeeId,
      lop: parseFloat(form.lop || "0"),
      date: todayStr.split("/").join("-"), // "DD-MM-YYYY"
      month: `${selectedMonth}-${selectedYear}`,
      salary_structure,
      "Tax Deduction at Source (TDS)": parseFloat(tds) || 0,
    };

    setIsLoading(true);
    try {
      // Download PDF via postBlob
      const blob = await postBlob("/employee/salaryslip", payload);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip_${selectedEmployee.employeeId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      await Swal.fire({
        icon: "success",
        title: "Payslip Generated",
        text: "Your PDF has been downloaded.",
        timer: 1500,
        showConfirmButton: false,
      });

      router.push("/payslip");
    } catch (err: any) {
      console.error("Error generating payslip:", err);
      await Swal.fire({
        icon: "error",
        title: "Generation Failed",
        text: err.message || "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = [String(currentYear-1), String(currentYear), String(currentYear + 1)];

  return (
    <div className="min-h-screen bg-indigo-100 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-4">Generate Employee Payslip</h1>

        {/* Select Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <Select
            onValueChange={(val) =>
              setSelectedEmployee(
                employees.find((e) => e.employeeId === val) || null
              )
            }
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.employeeId} value={emp.employeeId}>
                  {emp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            onValueChange={(val) => setSelectedMonth(val)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const month = String(i + 1).padStart(2, "0");
                const name = new Date(0, i).toLocaleString("default", {
                  month: "long",
                });
                return (
                  <SelectItem key={month} value={month}>
                    {name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Select
            onValueChange={(val) => setSelectedYear(val)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((yr) => (
                <SelectItem key={yr} value={yr}>
                  {yr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Employee Info (now editable) */}
        {selectedEmployee && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {[
              { label: "Department", value: selectedEmployee.department },
              { label: "Designation", value: selectedEmployee.designation },
              { label: "Email", value: selectedEmployee.email },
              { label: "Date of Birth", value: selectedEmployee.dob },
              { label: "Date of Joining", value: selectedEmployee.date_of_joining },
              { label: "PAN Number", value: selectedEmployee.pan_number },
              {
                label: "Bank Account Number",
                value: selectedEmployee.bank_details?.account_number || "",
              },
              {
                label: "Basic Salary (Monthly)",
                value: String(selectedEmployee.base_salary),
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <label className="block text-sm font-medium mb-1">{label}</label>
                {/* now editable */}
                <Input
                  value={value}
                  onChange={(e) => {
                    /* optionally update local state if needed */
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Salary Components */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {[
            { name: "basic", label: "Basic Salary" },
            { name: "hra", label: "House Rent Allowance" },
            { name: "overtime", label: "Overtime Bonus" },
            { name: "bonus", label: "Performance Bonus" },
            { name: "others", label: "Special Allowance" },
            { name: "lop", label: "Loss of Pay (LOP)" },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="block text-sm font-medium mb-1">{label}</label>
              <Input
                name={name}
                type="number"
                value={form[name]}
                onChange={handleInput}
                disabled={isLoading}
                placeholder={label}
              />
            </div>
          ))}
        </div>

        {/* TDS */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">TDS Deduction</label>
          <Input
            name="tds"
            type="number"
            value={tds}
            onChange={(e) => setTds(e.target.value)}
            disabled={isLoading}
            placeholder="TDS Deduction"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="mt-6 w-full"
        >
          {isLoading ? "Generating…" : "Generate"}
        </Button>
      </div>
    </div>
  );
};

export default GeneratePayslip;
