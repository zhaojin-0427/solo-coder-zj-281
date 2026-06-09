import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '../types';

const BASE_URL = 'http://localhost:9102';
const TIMEOUT = 10000;

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data, config } = error.response;
      console.error(`[API Response Error] ${status} ${config.method?.toUpperCase()} ${config.url}`, data);
      
      let errorMessage = '请求失败';
      if (data && data.error) {
        errorMessage = data.error;
      } else if (status === 404) {
        errorMessage = '资源不存在';
      } else if (status === 500) {
        errorMessage = '服务器内部错误';
      } else if (status === 400) {
        errorMessage = data?.error || '请求参数错误';
      }
      
      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      console.error('[API Network Error] No response received', error.message);
      return Promise.reject(new Error('网络连接失败，请检查服务器是否启动'));
    } else {
      console.error('[API Error]', error.message);
      return Promise.reject(error);
    }
  }
);

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await axiosInstance.request<ApiResponse<T>>(config);
  const result = response.data;
  
  if (!result.success) {
    throw new Error(result.error || '请求失败');
  }
  
  return result.data;
}

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ ...config, method: 'GET', url });
}

export async function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ ...config, method: 'POST', url, data });
}

export async function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ ...config, method: 'PUT', url, data });
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ ...config, method: 'DELETE', url });
}

export default axiosInstance;
