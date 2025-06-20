"use client";

import React, { FC, useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import { post } from '@/app/utils/apiClient';

interface Subadmin {
  name: string;
  permissions: Record<string, number>;
  username: string;
  employeeId: string;
  subadminId: string;
}

const rowsPerPage = 5;

const UserAccess: FC = () => {
  const [data, setData] = useState<Subadmin[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const fetchSubadmins = async () => {
    setIsLoading(true);
    try {
      const result = await post<{
        success: boolean;
        data: { subadmins: Subadmin[]; total: number };
        message?: string;
      }>('/subadmin/getlist', {
        search,
        page: currentPage + 1,
        pageSize: rowsPerPage,
      });

      if (result.success) {
        setData(result.data.subadmins || []);
        setTotal(result.data.total || 0);
      } else {
        throw new Error(result.message || 'Failed to load users');
      }
    } catch (err: any) {
      console.error('Error fetching subadmins:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Load Failed',
        text: err.message || 'Could not fetch user access list.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubadmins();
  }, [currentPage, search]);

  const handleNavigate = () => {
    router.push('/useraccess/manage');
  };

  const handleDelete = async (subadminId: string) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will remove the subadmin access.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
    });

    if (!isConfirmed) return;

    setIsLoading(true);
    try {
      const result = await post<{ success: boolean; message?: string }>(
        '/subadmin/deleterecord',
        { subadminId }
      );

      if (result.success) {
        await Swal.fire({
          title: 'Deleted!',
          text: 'Subadmin removed successfully.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
        
        fetchSubadmins(); // Refresh list
      } else {
        throw new Error(result.message || 'Deletion failed');
      }
    } catch (err: any) {
      console.error('Error deleting subadmin:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: err.message || 'Could not delete subadmin.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const paginatedData = data;

  return (
    <div className="min-h-screen bg-indigo-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow">
          <h1 className="text-xl font-semibold mb-4">User Access</h1>

          {/* Search & Add */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <Input
              placeholder="Search user..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(0);
              }}
              disabled={isLoading}
              className="w-full sm:w-64"
            />
            <Button
              onClick={handleNavigate}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Add User Access
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="hidden md:table-cell">Username</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row, idx) => (
                  <TableRow key={idx} className="align-top">
                    <TableCell className="font-medium whitespace-nowrap">
                      {row.employeeId}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(row.permissions)
                          .filter(([, val]) => val)
                          .map(([perm], i) => (
                            <Badge key={i} variant="secondary">
                              {perm}
                            </Badge>
                          ))}
                      </div>
                      <div className="mt-2 text-sm text-gray-500 md:hidden">
                        Username: {row.username}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap hidden md:table-cell">
                      {row.username}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="destructive"
                          size="icon"
                          disabled={isLoading}
                          onClick={() => handleDelete(row.subadminId)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!paginatedData.length && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
              disabled={isLoading || currentPage === 0}
              className="w-full sm:w-auto"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage + 1} of {Math.ceil(total / rowsPerPage) || 1}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={isLoading || (currentPage + 1) * rowsPerPage >= total}
              className="w-full sm:w-auto"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAccess;
