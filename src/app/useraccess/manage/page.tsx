"use client";

import React, { FC, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import { post } from '@/app/utils/apiClient';

// 1️⃣ Define the available permissions, including KPI management
const permissionsList = [
  'View payslip details',
  'Generate payslip',
  'View Invoice details',
  'Generate invoice details',
  'Add Employee Details',
  'View Employee Details',
  'Manage KPI',
];

interface Employee {
  employeeId: string;
  name: string;
}

const ManageAccess: FC = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load employee list
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const result = await post<{
          success: boolean;
          data: { employees: Employee[] };
          message?: string;
        }>('/employee/getlist', { page: 1, pageSize: 100 });

        if (result.success) {
          setEmployees(result.data.employees);
        } else {
          throw new Error(result.message || 'Failed to load employees');
        }
      } catch (err: any) {
        console.error(err);
        await Swal.fire({
          icon: 'error',
          title: 'Load Failed',
          text: err.message || 'Could not fetch employee list.',
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handlePermissionToggle = (perm: string) => {
    setSelectedPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  // Submit new subadmin with selected permissions
  const handleSubmit = async () => {
    if (!selectedEmployee || !username || !password || selectedPermissions.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Incomplete Form',
        text: 'Please fill all fields and pick at least one permission.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const adminId = localStorage.getItem('adminId') || '';
      const payload = {
        adminid: adminId,
        employeeid: selectedEmployee,
        username,
        password,
        permissions: selectedPermissions.reduce<Record<string, number>>((acc, perm) => {
          acc[perm] = 1;
          return acc;
        }, {}),
      };

      const result = await post<{ success: boolean; message?: string }>(
        '/subadmin/register',
        payload
      );

      if (result.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Registered!',
          text: 'Subadmin created successfully.',
          timer: 1500,
          showConfirmButton: false,
        });
        // Reset form and navigate back
        setSelectedEmployee('');
        setUsername('');
        setPassword('');
        setSelectedPermissions([]);
        router.push('/useraccess');
      } else {
        throw new Error(result.message || 'Registration failed');
      }
    } catch (err: any) {
      console.error(err);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Could not register subadmin.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-100 p-6">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-4">User Access Control</h1>

        {/* Employee selector */}
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Select Employee
        </label>
        <select
          value={selectedEmployee}
          onChange={e => setSelectedEmployee(e.target.value)}
          disabled={isLoading}
          className="w-full mb-4 p-2 border rounded-lg"
        >
          <option value="">
            {isLoading ? 'Loading employees…' : '-- Choose an employee --'}
          </option>
          {employees.map(emp => (
            <option key={emp.employeeId} value={emp.employeeId}>
              {emp.name}
            </option>
          ))}
        </select>

        {/* Username & Password */}
        <label className="block mb-2 text-sm font-medium text-gray-700">Username</label>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          disabled={isLoading}
          className="w-full mb-4 p-2 border rounded-lg"
        />

        <label className="block mb-2 text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={isLoading}
          className="w-full mb-4 p-2 border rounded-lg"
        />

        {/* Permissions */}
        <p className="text-sm font-medium text-gray-700 mb-2">Assign Permissions</p>
        <div className="space-y-2 mb-4">
          {permissionsList.map(perm => (
            <label key={perm} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedPermissions.includes(perm)}
                onChange={() => handlePermissionToggle(perm)}
                disabled={isLoading}
              />
              <span>{perm}</span>
            </label>
          ))}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={
            isLoading ||
            !selectedEmployee ||
            !username ||
            !password ||
            selectedPermissions.length === 0
          }
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving…' : 'Save Access'}
        </button>
      </div>
    </div>
  );
};

export default ManageAccess;
