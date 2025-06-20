"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Lexend } from 'next/font/google';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import Swal from 'sweetalert2';

// ←— import your shared post helper
import { post } from '../utils/apiClient';
import { Metadata } from 'next';

const lexend = Lexend({ subsets: ['latin'], weight: ['400', '700'] });

type LoginResponse = {
  success: boolean;
  message?: string;
  data: {
    role: 'admin' | 'subadmin';
    adminId?: string;
    subadminId?: string;
    permissions?: Record<string, any>;
    employeeId: string;
  };
};

const LoginPage: React.FC = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
    const role = localStorage.getItem('role');
    if (role && pathname !== '/') {
      router.replace('/');
    }
  }, [router, pathname]);

  if (!isMounted) return null;

  const showError = (msg: string) =>
    Swal.fire({ icon: 'error', title: 'Login Failed', text: msg });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!emailOrUsername.trim() || !password) {
      showError('Please fill in all fields.');
      setIsLoading(false);
      return;
    }

    try {
      // ←— use the post helper; it uses your NEXT_PUBLIC_API_BASE_URL
      const result = await post<LoginResponse>('/admin/login', {
        email: emailOrUsername.trim(),
        password,
      });

      if (result.success) {
        const { role, adminId, subadminId, permissions, employeeId } = result.data;

        localStorage.setItem('role', role);
        if (role === 'admin') {
          localStorage.setItem('adminId', adminId!);
        } else {
          localStorage.setItem('subadminId', subadminId!);
          localStorage.setItem('permissions', JSON.stringify(permissions || {}));
          localStorage.setItem('employeeId', employeeId);
        }

        Swal.fire({
          icon: 'success',
          title: 'Login Successful',
          text: 'Redirecting…',
          timer: 1200,
          showConfirmButton: false,
        });
        setTimeout(() => router.replace('/'), 1200);
      } else {
        showError(result.message || 'Invalid credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      showError('Something went wrong. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${lexend.className} min-h-screen flex flex-col md:flex-row`}>
      {/* Left side welcome panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 p-6">
        <div className="text-white text-center md:text-left max-w-sm space-y-4">
          <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">Welcome Back!</h2>
          <p className="text-base md:text-lg opacity-90">
            Enter your credentials to access your dashboard and manage your office seamlessly.
          </p>
        </div>
      </div>

      {/* Right side form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-100">
        <div className="w-full max-w-sm bg-white shadow-md rounded-lg p-8 space-y-5">
          <h1 className="text-2xl font-bold text-center">Enoylity Login</h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email / Username</label>
              <input
                type="text"
                value={emailOrUsername}
                onChange={e => setEmailOrUsername(e.target.value)}
                placeholder="Enter email or username"
                autoComplete="username"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                  onClick={() => setShowPassword(prev => !prev)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 font-semibold rounded-md transition duration-200 ${
                isLoading
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
