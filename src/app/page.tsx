"use client";

import React, { FC, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface Option {
  title: string;
  route: string;
  icon: string;
  permissionKey?: string;
}

interface Group {
  title: string;
  permissionKeys: string[];
  options: Option[];
  color: keyof typeof colorClasses;
}

const colorClasses: Record<string, { headerText: string; headerBorder: string; iconBg: string; iconText: string }> = {
  indigo: {
    headerText: 'text-indigo-600',
    headerBorder: 'border-indigo-200',
    iconBg: 'bg-indigo-50',
    iconText: 'text-indigo-500',
  },
  emerald: {
    headerText: 'text-emerald-600',
    headerBorder: 'border-emerald-200',
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-500',
  },
  amber: {
    headerText: 'text-amber-600',
    headerBorder: 'border-amber-200',
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-500',
  },
  teal: {
    headerText: 'text-teal-600',
    headerBorder: 'border-teal-200',
    iconBg: 'bg-teal-50',
    iconText: 'text-teal-500',
  },
};

const groups: Group[] = [
  {
    title: 'Invoice',
    permissionKeys: ['Generate invoice details', 'View Invoice details'],
    options: [
      { title: 'MHD Tech', route: '/invoice/mhdtech', icon: '🧾' },
      { title: 'Enoylity Studio', route: '/invoice/enoylitystudio', icon: '🧾' },
      { title: 'Enoylity Media Creations LLC', route: '/invoice/enoylitytech', icon: '🧾' },
    ],
    color: 'indigo',
  },
  {
    title: 'Payslip',
    permissionKeys: ['Generate payslip', 'View payslip details'],
    options: [
      { title: 'Enoylity Studio', route: '/payslip', icon: '📄' }
    ],
    color: 'emerald',
  },
  {
    title: 'Employees',
    permissionKeys: ['Add Employee Details', 'View Employee Details'],
    options: [
      { title: 'Add', route: '/employee/addedit', icon: '➕', permissionKey: 'Add Employee Details' },
      { title: 'View', route: '/employee', icon: '👥', permissionKey: 'View Employee Details' },
    ],
    color: 'teal',
  },
  {
    title: 'KPI',
    permissionKeys: ['Manage KPI'],
    options: [
      { title: 'Add KPI', route: '/kpi/addupdate', icon: '➕📈', permissionKey: 'Manage KPI' },
      { title: 'View KPI', route: '/kpi', icon: '📈', permissionKey: 'Manage KPI' },
    ],
    color: 'amber',
  },
  {
    title: 'User Access',
    permissionKeys: [],
    options: [
      { title: 'Manage', route: '/useraccess', icon: '🛡️' }
    ],
    color: 'amber',
  },
  {
    title: 'Settings',
    permissionKeys: [],
    options: [
      { title: 'Update Invoice', route: '/settings/invoice', icon: '🧾' },
      { title: 'Update Payslip', route: '/settings/payslip', icon: '📄' },
      { title: 'Update Login', route: '/settings/update', icon: '🔐' },
    ],
    color: 'amber',
  }
];

const Dashboard: FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, number>>({});

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    const storedPermissions = localStorage.getItem('permissions');

    if (!storedRole) {
      router.replace('/login');
    } else {
      setRole(storedRole);
      if (storedRole === 'subadmin' && storedPermissions) {
        setPermissions(JSON.parse(storedPermissions));
      }
    }
  }, [router]);

  const hasPermission = (key: string) => permissions[key] === 1;

  return (
    <div className="min-h-screen py-1 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Dashboard</h1>

        {groups
          .filter((group) => {
            if (role === 'admin') return true;
            return group.permissionKeys.some((key) => hasPermission(key));
          })
          .map((group, gi) => {
            const classes = colorClasses[group.color] || colorClasses['indigo'];

            return (
              <section key={gi} className="mb-12">
                <h2
                  className={`text-2xl font-semibold ${classes.headerText} border-b-2 ${classes.headerBorder} pb-2 mb-6`}
                >
                  {group.title}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.options
                    .filter((opt) => {
                      if (role === 'admin') return true;
                      const permKey = opt.permissionKey;
                      return permKey ? hasPermission(permKey) : true;
                    })
                    .map((opt, oi) => (
                      <div
                        key={oi}
                        onClick={() => router.push(opt.route)}
                        className="bg-white border border-transparent rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-gray-200 hover:shadow-lg transition"
                      >
                        <div className={`${classes.iconBg} p-4 rounded-full mb-4`}>
                          <span className={`${classes.iconText} text-4xl`}>{opt.icon}</span>
                        </div>
                        <p className="text-lg font-medium text-gray-700">{opt.title}</p>
                      </div>
                    ))}
                </div>
              </section>
            );
          })}
      </div>
    </div>
  );
};

export default Dashboard;
