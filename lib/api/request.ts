import axios, { type AxiosResponse, isAxiosError } from "axios";

import type { ApiResponse } from "./response";

/** 是否为服务端统一包装的 {@link ApiResponse}（通过 `success` 布尔字段识别） */
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

// 3. 响应拦截：统一格式解包为 `data`；失败信息与旧版 `{ message }` 一并兼容
// 注：拦截器实际返回的是响应 body（与 axios 默认声明「仍返回 AxiosResponse」不一致，沿用历史约定）
service.interceptors.response.use(
  ((response: AxiosResponse<unknown>) => {
    const payload = response.data;
    if (isUnifiedEnvelope(payload)) {
      if (!payload.success) {
        return rejectWithMessage(payload.message ?? `请求失败（${response.status}）`);
      }
      return payload.data;
    }
    return payload;
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

    if (
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof (body as { message: unknown }).message === "string"
    ) {
      return rejectWithMessage((body as { message: string }).message);
    }

    return Promise.reject(error);
  },
);

export default service;
