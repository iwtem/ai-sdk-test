import request from "./request";

/** 恢复文件 */
export const restoreFile = (fileId: string) => {
  return request.patch(`/files/${fileId}`, {
    restore: true,
  });
};

/** 彻底删除文件 */
export const purgeFile = (fileId: string) => {
  return request.post(`/files/${fileId}/purge`);
};
