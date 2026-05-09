import axios, { type AxiosResponse, isAxiosError } from "axios";

import type { ApiResponse } from "./response";

function isUnifiedEnvelope(data: unknown): data is ApiResponse {
  if (typeof data !== "object" || data === null) return false;
  if (!("success" in data)) return false;
  return typeof (data as { success: unknown }).success === "boolean";
}

function rejectWithMessage(message: string) {
  return Promise.reject(new Error(message));
}

// 1. 创建实例
const service = axios.create({
  baseURL: "/api",
  timeout: 30 * 1000,
});

// 2. 请求拦截
service.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 3. 响应拦截：仅处理统一 {@link ApiResponse}，解包为 data
// 注：拦截器实际返回 body（与 axios 类型声明不一致），需外部断言，见下方 `as`
service.interceptors.response.use(
  ((response: AxiosResponse<unknown>) => {
    const payload = response.data;
    if (!isUnifiedEnvelope(payload)) {
      return rejectWithMessage(`响应格式异常（HTTP ${response.status}）`);
    }
    if (!payload.success) {
      return rejectWithMessage(payload.message ?? `请求失败（${response.status}）`);
    }
    return payload.data;
  }) as (
    response: AxiosResponse<unknown>,
  ) => AxiosResponse<unknown> | Promise<AxiosResponse<unknown>>,
  (error: unknown) => {
    if (!isAxiosError(error) || !error.response) {
      return Promise.reject(error);
    }

    const body = error.response.data as unknown;
    if (isUnifiedEnvelope(body)) {
      return rejectWithMessage(body.message ?? `请求失败（${error.response.status}）`);
    }

    return rejectWithMessage(`请求失败（${error.response.status}）`);
  },
);

export default service;
