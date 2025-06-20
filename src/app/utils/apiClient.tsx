// utils/apiClient.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Simple POST helper
 * @param url  - API endpoint (relative to baseURL)
 * @param data - Request body
 * @returns    Response data of type T
 */
export const post = async <T = any>(
  url: string,
  data?: any
): Promise<T> => {
  const response = await api.post<T>(url, data);
  return response.data;
};

/**
 * Simple GET helper
 * @param url    - API endpoint (relative to baseURL)
 * @param params - Query parameters
 * @returns      Response data of type T
 */
export const get = async <T = any>(
  url: string,
  params?: Record<string, any>
): Promise<T> => {
  const response = await api.get<T>(url, { params });
  return response.data;
};

export const postBlob = async (
  url: string,
  data?: any
): Promise<Blob> => {
  const response = await api.post(url, data, { responseType: 'blob' });
  return response.data;
};