import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  success: boolean; // 执行结果
  data?: T; // 成功时返回的数据
  message?: string; // 错误信息或提示
  code?: number; // 内部业务错误码
  timestamp: number; // 时间戳（便于排查日志）
}

export function successResponse<T>(data: T, message = "Success") {
  const body: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: Date.now(),
  };
  return NextResponse.json(body, { status: 200 });
}

/** @param data 可选附加信息（如校验 errors） */
export function errorResponse(
  message = "Internal Server Error",
  code = 500,
  status = code,
  data?: unknown,
) {
  const body: ApiResponse = {
    success: false,
    code,
    message,
    timestamp: Date.now(),
    data,
  };
  return NextResponse.json(body, { status });
}

/** 包装异步处理器：异常时返回 {@link errorResponse}，正常返回原结果 */
export function withErrorHandler<TArgs extends unknown[], R>(
  handler: (...args: TArgs) => Promise<R>,
): (...args: TArgs) => Promise<R | ReturnType<typeof errorResponse>> {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "服务器异常";
      return errorResponse(message);
    }
  };
}
