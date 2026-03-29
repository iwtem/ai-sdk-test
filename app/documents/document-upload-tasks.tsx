import { Button } from "~/components/ui/button";
import { formatBytes } from "./format";
import type { UploadTask } from "./types";

type DocumentUploadTasksProps = {
  tasks: UploadTask[];
  uploading: boolean;
  onRetry: (task: UploadTask) => void;
};

export function DocumentUploadTasks({ tasks, uploading, onRetry }: DocumentUploadTasksProps) {
  if (tasks.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="mb-3 font-medium text-sm">上传任务</h3>
      <div className="space-y-2">
        {tasks.map((task) => (
          <div key={task.id} className="rounded-lg border border-border bg-background px-3 py-2">
            <div className="mb-1 flex items-center justify-between gap-3">
              <p className="truncate font-medium text-sm">{task.file.name}</p>
              <span className="text-muted-foreground text-xs">{formatBytes(task.file.size)}</span>
            </div>
            <div className="mb-1 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all ${
                  task.status === "error"
                    ? "bg-destructive"
                    : task.status === "success"
                      ? "bg-emerald-500"
                      : "bg-primary"
                }`}
                style={{ width: `${task.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-xs">
                {task.status === "pending"
                  ? "等待中"
                  : task.status === "uploading"
                    ? `上传中 ${task.progress}%`
                    : task.status === "success"
                      ? task.message || "上传成功"
                      : task.message || "上传失败"}
              </span>
              {task.status === "error" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRetry(task)}
                  disabled={uploading}
                >
                  重试
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
