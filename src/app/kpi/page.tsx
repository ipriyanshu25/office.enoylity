"use client";

import React, { FC, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaSort,
  FaSortUp,
  FaSortDown,
  FaPlus,
  FaEdit,
  FaTrash
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { post } from '../utils/apiClient';

export interface KpiItem {
  kpiId: string;
  employeeId: string;
  employeeName: string;
  projectName: string;
  startdate: string | null;
  deadline: string | null;
  remark: string;
  points: number;
  lastPunchDate?: string;
  lastPunchRemark?: string;
  lastPunchStatus?: string | null;
}

const COLUMNS: Array<keyof KpiItem> = [
  'employeeName',
  'projectName',
  'startdate',
  'deadline',
  'remark',
  'points'
];

const KpisPage: FC = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortField, setSortField] = useState<keyof KpiItem>('startdate');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Permissions & role
  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, number>>({});
  useEffect(() => {
    setRole(localStorage.getItem('role'));
    try {
      setPermissions(JSON.parse(localStorage.getItem('permissions') || '{}'));
    } catch {
      setPermissions({});
    }
  }, []);

  const canView = useMemo(
    () => role === 'admin' || role === 'subadmin' || permissions['View KPI details'] === 1,
    [role, permissions]
  );
  const canAdd = useMemo(
    () => role === 'admin' || role === 'subadmin' || permissions['Add KPI details'] === 1,
    [role, permissions]
  );
  const canDelete = useMemo(
    () => role === 'admin' || permissions['Delete KPI'] === 1,
    [role, permissions]
  );

  // Data state
  const [data, setData] = useState<KpiItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const employeeId = localStorage.getItem('employeeId');
      // Determine API sort field (backend supports createdAt, startdate, deadline)
      const apiSortField = sortField === 'startdate' || sortField === 'deadline' ? sortField : 'createdAt';
      const sortOrder = sortAsc ? 'asc' : 'desc';

      // Build common payload
      const payload: any = {
        search,
        page,
        pageSize: perPage,
        sortBy: apiSortField,
        sortOrder
      };
      if (startDate && endDate) {
        payload.startDate = startDate;
        payload.endDate = endDate;
      }

      // Subadmin (except special) -> getByEmployeeId
      if (role === 'subadmin' && employeeId && employeeId !== 'EMC01010') {
        payload.employeeId = employeeId;
        const res = await post<{ success: boolean; data: { kpis: any[] } }>('/kpi/getByEmployeeId', payload);
        if (res.success) {
          const mapped = res.data.kpis.map(r => {
            const last = r.punches?.length ? r.punches[r.punches.length - 1] : null;
            return {
              kpiId: r.kpiId,
              employeeId: r.employeeId,
              employeeName: r.employeeName,
              projectName: r.projectName,
              startdate: r.startdate || null,
              deadline: r.deadline || null,
              remark: r.Remark || '',
              points: r.points,
              lastPunchDate: last?.punchDate,
              lastPunchRemark: last?.remark,
              lastPunchStatus: last?.status ?? null,
            } as KpiItem;
          });
          setData(mapped);
          setTotalPages(1);
          setPage(1);
        } else {
          Swal.fire('Error', 'Failed to fetch your KPIs', 'error');
        }
      } else {
        // Admins and others -> getAll
        const res = await post<{
          success: boolean;
          data: { kpis: any[]; page: number; pageSize: number; total: number };
        }>('/kpi/getAll', payload);
        if (res.success) {
          const mapped = res.data.kpis.map(r => {
            const last = r.punches?.length ? r.punches[r.punches.length - 1] : null;
            return {
              kpiId: r.kpiId,
              employeeId: r.employeeId,
              employeeName: r.employeeName,
              projectName: r.projectName,
              startdate: r.startdate || null,
              deadline: r.deadline || null,
              remark: r.Remark || r.remark || '',
              points: r.points,
              lastPunchDate: last?.punchDate,
              lastPunchRemark: last?.remark,
              lastPunchStatus: last?.status ?? null,
            } as KpiItem;
          });
          setData(mapped);
          setTotalPages(Math.ceil(res.data.total / perPage));
        } else {
          Swal.fire('Error', 'Failed to fetch KPIs', 'error');
        }
      }
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'Failed to fetch KPIs', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, startDate, endDate, page, sortField, sortAsc, role]);

  useEffect(() => {
    if (canView) fetchData();
  }, [canView, fetchData]);

  // Sorting and paging (client-side fallbacks)
  const sorted = useMemo(
    () => [...data].sort((a, b) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    }),
    [data, sortField, sortAsc]
  );
  const pageData = useMemo(
    () => sorted.slice((page - 1) * perPage, page * perPage),
    [sorted, page]
  );

  // Handlers
  const onSort = (field: keyof KpiItem) => {
    if (field === sortField) setSortAsc(p => !p);
    else { setSortField(field); setSortAsc(true); }
    setPage(1);
  };
  const toggleExpand = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const handleAdd = () => router.push('/kpi/addupdate');
  const handleEdit = (id: string) => router.push(`/kpi/addupdate?kpiId=${id}`);
  const handleDelete = async (id: string) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Delete KPI?',
      text: 'This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete'
    });
    if (!isConfirmed) return;
    try {
      const res = await post<{ success: boolean }>('/kpi/deleteKpi', { kpiId: id });
      if (res.success) fetchData();
      else Swal.fire('Error', 'Delete failed', 'error');
    } catch {
      Swal.fire('Error', 'Delete request failed', 'error');
    }
  };

  function handleViewPunch(arg0: string, arg1: string, arg2: string): void {
    throw new Error('Function not implemented.');
  }

  function handlePunch(kpiId: string): void {
    throw new Error('Function not implemented.');
  }

  // Punch-In handlers omitted for brevity (unchanged)

  return (
    <div className="min-h-screen bg-indigo-100 p-4">
      <div className="max-w-7xl mx-auto bg-white rounded shadow p-6 flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
          <input
            type="text"
            placeholder="Search by project..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="date"
            value={startDate}
            onChange={e => { setStartDate(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded"
          />
          <input
            type="date"
            value={endDate}
            onChange={e => { setEndDate(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded"
          />
          {canAdd && (
            <button
              onClick={handleAdd}
              className="flex items-center px-5 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              <FaPlus className="mr-2" /> Add KPI
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : !canView ? (
          <div className="text-center py-4">No view permissions.</div>
        ) : data.length === 0 ? (
          <div className="text-center py-4">No KPIs.</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead className="bg-gray-100">
                  <tr>
                    {COLUMNS.map(col => (
                      <th
                        key={col}
                        onClick={() => onSort(col)}
                        className="px-3 py-2 text-left cursor-pointer whitespace-nowrap"
                      >
                        <div className="flex items-center">
                          {col.charAt(0).toUpperCase() + col.slice(1)}
                          {sortField === col
                            ? sortAsc ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                            : <FaSort className="ml-1 text-gray-400" />}
                        </div>
                      </th>
                    ))}
                    <th className="px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map(k => (
                    <tr key={k.kpiId} className="border-t hover:bg-gray-50">
                      {COLUMNS.map(col => (
                        <td key={col} className="px-3 py-2 whitespace-nowrap text-sm">{k[col]}</td>
                      ))}
                      <td className="px-3 py-2 whitespace-nowrap text-sm flex gap-2">
                        <button
                          onClick={() => handleEdit(k.kpiId)}
                          className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          <FaEdit />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(k.kpiId)}
                            className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            <FaTrash />
                          </button>
                        )}
                        {!k.lastPunchDate ? (
                          <button
                            onClick={() => handlePunch(k.kpiId)}
                            className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            PunchIn
                          </button>
                        ) : (
                          <>
                            <button
                              disabled
                              className="px-2 py-1 bg-gray-400 text-white rounded"
                            >
                              PunchIn
                            </button>
                            <button
                              onClick={() => handleViewPunch(
                                k.lastPunchDate!,
                                k.lastPunchRemark!,
                                k.lastPunchStatus!
                              )}
                              className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              ViewPunch
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="sm:hidden">
              {pageData.map(k => (
                <div key={k.kpiId} className="bg-white mb-4 rounded shadow">
                  <div className="flex justify-between p-4">
                    <div>
                      <div className="font-semibold">{k.projectName}</div>
                      <div className="text-sm text-gray-600">{k.employeeName}</div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(k.kpiId)}
                        className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        <FaEdit />
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(k.kpiId)}
                          className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          <FaTrash />
                        </button>
                      )}
                      <button onClick={() => toggleExpand(k.kpiId)}>
                        {expanded[k.kpiId] ? <FaSortUp /> : <FaSortDown />}
                      </button>
                    </div>
                  </div>
                  {expanded[k.kpiId] && (
                    <div className="p-4 space-y-2 text-sm">
                      <div><strong>Start:</strong> {k.startdate}</div>
                      <div><strong>Deadline:</strong> {k.deadline}</div>
                      <div><strong>Remark:</strong> {k.remark}</div>
                      <div><strong>Points:</strong> {k.points}</div>
                      {!k.lastPunchDate ? (
                        <button
                          onClick={() => handlePunch(k.kpiId)}
                          className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          PunchIn
                        </button>
                      ) : (
                        <div className="flex space-x-2 mt-2">
                          <button
                            disabled
                            className="px-4 py-2 bg-gray-400 text-white rounded"
                          >
                            PunchIn
                          </button>
                          <button
                            onClick={() => handleViewPunch(
                              k.lastPunchDate!,
                              k.lastPunchRemark!,
                              k.lastPunchStatus!
                            )}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            ViewPunch
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-4 space-x-2">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-1 border rounded ${page === i + 1 ? 'bg-indigo-200' : ''}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
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

export default KpisPage;
