'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from './sidebar';

interface ClientWrapperProps {
  children: React.ReactNode;
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (!role && !isLoginPage) {
      router.replace('/login');
    }
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return <main className="min-h-screen bg-indigo-100">{children}</main>;
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-h-screen bg-indigo-100 pt-16 md:pt-10 px-4 md:ml-60 lg:ml-60">
        {children}
      </main>
    </div>
  );
}
