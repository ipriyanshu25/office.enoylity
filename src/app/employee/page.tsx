"use client";

import React, { FC, useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  FaSort,
  FaSortUp,
  FaSortDown,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaEdit,
  FaTrash
} from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { post } from '../utils/apiClient';

export interface Employee {
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  adharnumber: string;
  pan_number: string;
  date_of_joining: string;
  annual_salary: number;
  monthly_salary: number;
  ctc: number;
  bank_details: { account_number: string; ifsc: string; bank_name: string };
  address: { line1: string; city: string; state: string; pin: string };
  department?: string;
  designation?: string;
}

const COLUMNS: Array<keyof Employee> = [
  'employeeId',
  'name',
  'email',
  'phone',
  'department',
  'designation'
];

export default function EmployeesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof Employee>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, number>>({});

  // Permissions
  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    const storedPermissions = JSON.parse(localStorage.getItem('permissions') || '{}');
    setRole(storedRole);
    setPermissions(storedPermissions);
  }, []);

  const canView = useMemo(
    () => role === 'admin' || permissions['View Employee Details'] === 1,
    [role, permissions]
  );
  const canAdd = useMemo(
    () => role === 'admin' || permissions['Add Employee Details'] === 1,
    [role, permissions]
  );

  // Fetch employees
  const [data, setData] = useState<Employee[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await post<
        { success: boolean; data: { employees: Employee[]; totalPages: number } }
      >('/employee/getlist', { search, page, pageSize: perPage });

      if (result.success) {
        setData(result.data.employees);
        setTotalPages(result.data.totalPages);
        if (result.data.employees.length === 0) {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: 'No employees found.',
            showConfirmButton: false,
            timer: 1500
          });
        }
      }
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'Failed to fetch employees', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    if (canView) fetchData();
  }, [fetchData, canView]);

  // Sorting
  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortAsc]);

  const pageData = useMemo(() => {
    return sorted.slice((page - 1) * perPage, page * perPage);
  }, [sorted, page]);

  // Handlers
  const onSort = (field: keyof Employee) => {
    if (field === sortField) setSortAsc((p) => !p);
    else {
      setSortField(field);
      setSortAsc(true);
    }
    setPage(1);
  };

  const toggleExpand = (id: string) => {
    setExpanded((p) => ({ ...p, [id]: !p[id] }));
  };

  const handleEdit = (id: string) => {
    router.push(`/employee/addedit?employeeId=${id}`);
  };

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: 'This cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Delete'
    });
    if (!confirm.isConfirmed) return;

    try {
      const result = await post<{ success: boolean; message?: string }>(
        '/employee/delete',
        { employeeId: id }
      );

      if (result.success) {
        Swal.fire('Deleted', 'Employee removed', 'success');
        fetchData();
      } else {
        Swal.fire('Error', result.message || 'Delete failed', 'error');
      }
    } catch {
      Swal.fire('Error', 'Delete failed', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-indigo-100 p-4">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow p-6 flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          {canAdd && (
            <button
              onClick={() => router.push('/employee/addedit')}
              className="flex items-center px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <FaPlus className="mr-2" /> Add Employee
            </button>
          )}
        </div>

        {/* Loading & Permissions */}
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : !canView ? (
          <div className="text-center py-4">You do not have permission to view this page.</div>
        ) : data.length === 0 ? (
          <div className="text-center py-4">No employees found.</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead className="bg-gray-100">
                  <tr>
                    {COLUMNS.map((col) => (
                      <th
                        key={col}
                        onClick={() => onSort(col)}
                        className="px-3 py-2 text-left cursor-pointer whitespace-nowrap"
                      >
                        <div className="flex items-center">
                          {col.charAt(0).toUpperCase() + col.slice(1)}
                          {sortField === col ? (
                            sortAsc ? (
                              <FaSortUp className="ml-1" />
                            ) : (
                              <FaSortDown className="ml-1" />
                            )
                          ) : (
                            <FaSort className="ml-1 text-gray-400" />
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((emp) => (
                    <tr key={emp.employeeId} className="border-t hover:bg-gray-50">
                      {COLUMNS.map((col) => (
                        <td key={col} className="px-3 py-2 whitespace-nowrap text-sm">
                          {typeof emp[col] === 'object' ? JSON.stringify(emp[col]) : emp[col] ?? ''}
                        </td>
                      ))}
                      <td className="px-3 py-2 whitespace-nowrap text-sm flex space-x-2">
                        <button
                          onClick={() => handleEdit(emp.employeeId)}
                          className="text-indigo-600 hover:text-indigo-800"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.employeeId)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <div className="sm:hidden">
              {pageData.map((emp) => (
                <div key={emp.employeeId} className="bg-white mb-4 rounded-lg shadow">
                  <div className="flex justify-between items-center p-4">
                    <div>
                      <div className="font-semibold">{emp.name}</div>
                      <div className="text-sm text-gray-600">{emp.email}</div>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => handleEdit(emp.employeeId)} className="text-indigo-600">
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDelete(emp.employeeId)} className="text-red-600">
                        <FaTrash />
                      </button>
                      <button onClick={() => toggleExpand(emp.employeeId)} className="p-2">
                        {expanded[emp.employeeId] ? <FaChevronUp /> : <FaChevronDown />}
                      </button>
                    </div>
                  </div>
                  {expanded[emp.employeeId] && (
                    <div className="bg-gray-50 p-4 space-y-1 text-sm">
                      <div><strong>ID:</strong> {emp.employeeId}</div>
                      <div><strong>Phone:</strong> {emp.phone}</div>
                      <div><strong>DOB:</strong> {emp.dob}</div>
                      <div><strong>CTC:</strong> {emp.annual_salary}</div>
                      <div><strong>Bank:</strong> {emp.bank_details.bank_name} ({emp.bank_details.ifsc})</div>
                      <div><strong>Address:</strong> {emp.address.line1}, {emp.address.city}</div>
                      {emp.department && <div><strong>Dept:</strong> {emp.department}</div>}
                      {emp.designation && <div><strong>Role:</strong> {emp.designation}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-4 space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-1 border rounded ${page === i + 1 ? 'bg-indigo-200' : ''}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
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
}
