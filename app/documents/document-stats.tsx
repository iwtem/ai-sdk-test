import { FileUp, FolderOpen, HardDrive } from "lucide-react";
import { formatBytes } from "./format";

interface DocumentStatsProps {
  totalCount: number;
  totalSize: number;
  weeklyUploaded: number;
}

export function DocumentStats({ totalCount, totalSize, weeklyUploaded }: DocumentStatsProps) {
  const statItems = [
    { label: "文件总数", value: totalCount, icon: FolderOpen },
    { label: "已用空间", value: formatBytes(totalSize), icon: HardDrive },
    { label: "本周上传", value: weeklyUploaded, icon: FileUp },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="rounded-2xl border border-border bg-card px-4 py-3">
            <div className="mb-2 inline-flex items-center gap-1.5 text-muted-foreground text-xs">
              <Icon className="size-4" />
              {item.label}
            </div>
            <div className="font-semibold text-2xl">{item.value}</div>
          </div>
        );
      })}
    </div>
  );
}
