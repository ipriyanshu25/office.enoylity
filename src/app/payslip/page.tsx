"use client";

import React, { FC, useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { post } from "@/app/utils/apiClient";
import { Eye, Edit2, Trash2 } from "lucide-react";

interface PayslipEntry {
  payslipId: string;
  employeeId: string;
  month: number;
  year: number;
  generated_on: string;
  lop_days: number;
}

interface APIResponse {
  success: boolean;
  message?: string;
  data: {
    payslips: PayslipEntry[];
    pagination: {
      totalRecords: number;
    };
  };
}

const PayslipHistory: FC = () => {
  const [data, setData] = useState<PayslipEntry[]>([]);
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const rowsPerPage = 5;
  const router = useRouter();

  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, number>>({});

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    const storedPermissions = localStorage.getItem("permissions");

    setRole(storedRole);
    setPermissions(storedPermissions ? JSON.parse(storedPermissions) : {});
  }, []);

  const canViewPayslips =
    role === "admin" || permissions["View payslip details"] === 1;
  const canGeneratePayslips =
    role === "admin" || permissions["Generate payslip"] === 1;

  useEffect(() => {
    const fetchPayslips = async () => {
      if (!canViewPayslips) return;

      setIsLoading(true);
      try {
        const payload = {
          search,
          month: monthFilter,
          year: yearFilter,
          page: currentPage,
          pageSize: rowsPerPage,
        };

        const result = await post<APIResponse>("/employee/getpayslips", payload);

        if (result.success) {
          setData(result.data.payslips);
          setTotalRecords(result.data.pagination.totalRecords);
        } else {
          throw new Error(result.message || "Failed to fetch payslips");
        }
      } catch (err: any) {
        console.error("Error fetching payslips:", err);
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: err.message || "Unable to load payslips. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayslips();
  }, [search, monthFilter, yearFilter, currentPage, canViewPayslips]);

  const handleGeneratePayslip = () => {
    router.push("/payslip/enoylity/generate");
  };

  const handleEditPayslip = (entry: PayslipEntry) => {
    router.push(`/payslip/enoylity/generate?id=${entry.payslipId}`);
  };

  const handleDeletePayslip = async (entry: PayslipEntry) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will permanently delete the payslip.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        setIsLoading(true);
        const response = await post<{ success: boolean; message?: string }>(
          '/employee/deletepayslip',
          { payslipId: entry.payslipId }
        );
        if (response.success) {
          setData(prev => prev.filter(item => item.payslipId !== entry.payslipId));
          setTotalRecords(prev => prev - 1);
          await Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Payslip has been deleted.',
            showConfirmButton: false,
            timer: 1500,
          });
        } else {
          throw new Error(response.message || 'Failed to delete payslip');
        }
      } catch (err: any) {
        console.error('Error deleting payslip:', err);
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.message || 'Could not delete payslip.',
          showConfirmButton: false,
          timer: 1500,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleViewPdf = (entry: PayslipEntry) => {
    window.open(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee/viewpdf/${entry.payslipId}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const paginatedData = data;
  const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage));

  return (
    <div className="min-h-screen bg-indigo-100 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <h1 className="text-xl font-semibold">Payslip History</h1>
            {canGeneratePayslips && (
              <Button onClick={handleGeneratePayslip} disabled={isLoading}>
                Generate New Payslip
              </Button>
            )}
          </div>

          {canViewPayslips ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <Input
                  placeholder="Search by employee ID..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  disabled={isLoading}
                  className="w-full"
                />
                <Input
                  placeholder="Filter by month..."
                  value={monthFilter}
                  onChange={(e) => {
                    setMonthFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  disabled={isLoading}
                  className="w-full"
                />
                <Input
                  placeholder="Filter by year..."
                  value={yearFilter}
                  onChange={(e) => {
                    setYearFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : paginatedData.length > 0 ? (
                      paginatedData.map((row) => (
                        <TableRow key={row.payslipId}>
                          <TableCell className="whitespace-nowrap font-medium">
                            {row.employeeId}
                          </TableCell>
                          <TableCell>{row.month}</TableCell>
                          <TableCell>{row.year}</TableCell>
                          <TableCell className="flex items-center gap-4 justify-start">
                            <Button
                              title="View PDF"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewPdf(row)}
                            >
                              <Eye className="h-5 w-5" />
                            </Button>
                            <Button
                              title="Edit Payslip"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditPayslip(row)}
                            >
                              <Edit2 className="h-5 w-5" />
                            </Button>
                            <Button
                              title="Delete Payslip"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeletePayslip(row)}
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500">
                          No payslips found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={isLoading || currentPage === 1}
                  className="w-full sm:w-auto"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((p) =>
                      p + 1 <= totalPages ? p + 1 : p
                    )
                  }
                  disabled={isLoading || currentPage === totalPages}
                  className="w-full sm:w-auto"
                >
                  Next
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-lg text-gray-600">
                You do not have permission to view payslip details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayslipHistory;