"use client";

import {
  BookOpenText,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Database,
  FileText,
  Filter,
  Globe2,
  Layers3,
  Plus,
  Search,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

type KnowledgeBase = {
  id: string;
  name: string;
  description: string;
  sourceCount: number;
  docCount: number;
  owner: string;
  status: "ready" | "indexing" | "warning";
  updatedAt: string;
  tags: string[];
};

const knowledgeBases: KnowledgeBase[] = [
  {
    id: "kb-001",
    name: "产品文档中心",
    description: "汇总 PRD、功能说明、版本变更和发布记录，支持售前与客服快速检索。",
    sourceCount: 12,
    docCount: 356,
    owner: "产品团队",
    status: "ready",
    updatedAt: "今天 11:40",
    tags: ["产品", "规范"],
  },
  {
    id: "kb-002",
    name: "客服知识库",
    description: "沉淀常见问题、工单回复模板和升级流程，覆盖从新手到高级故障处理。",
    sourceCount: 9,
    docCount: 489,
    owner: "客户成功",
    status: "indexing",
    updatedAt: "今天 10:12",
    tags: ["客服", "SOP"],
  },
  {
    id: "kb-003",
    name: "研发技术手册",
    description: "包含架构设计、接口协议、部署手册与排障经验，服务研发与运维协作。",
    sourceCount: 18,
    docCount: 622,
    owner: "研发平台组",
    status: "ready",
    updatedAt: "昨天 18:26",
    tags: ["研发", "架构"],
  },
  {
    id: "kb-004",
    name: "合规与法务资料",
    description: "汇总合同模板、隐私条款、审计材料和监管要求，供法务与运营查阅。",
    sourceCount: 6,
    docCount: 144,
    owner: "法务与合规",
    status: "warning",
    updatedAt: "3 天前",
    tags: ["法务", "风控"],
  },
];

const recentActivities = [
  {
    title: "客服知识库完成 124 篇文档重建索引",
    time: "5 分钟前",
    actor: "系统任务",
  },
  {
    title: "产品文档中心新增「多语言策略」分类",
    time: "27 分钟前",
    actor: "赵明",
  },
  {
    title: "合规与法务资料发现 3 个过期附件",
    time: "1 小时前",
    actor: "巡检机器人",
  },
];

function StatusBadge({ status }: { status: KnowledgeBase["status"] }) {
  if (status === "ready") {
    return (
      <Badge variant="secondary" className="text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="size-3.5" />
        就绪
      </Badge>
    );
  }

  if (status === "indexing") {
    return (
      <Badge variant="outline" className="text-amber-700 dark:text-amber-300">
        <Clock3 className="size-3.5" />
        索引中
      </Badge>
    );
  }

  return (
    <Badge variant="destructive">
      <CircleAlert className="size-3.5" />
      待处理
    </Badge>
  );
}

export default function DatasetsPage() {
  return (
    <section className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
              Knowledge Hub
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">知识库中心</h1>
            <p className="text-sm text-muted-foreground">
              统一管理团队知识资产，支持检索优化、内容治理与状态追踪（仅 UI 演示）。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline">
              <Sparkles className="size-4" />
              智能整理
            </Button>
            <Button>
              <Plus className="size-4" />
              新建知识库
            </Button>
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card px-4 py-3">
            <p className="mb-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Database className="size-4" />
              知识库数量
            </p>
            <p className="text-2xl font-semibold">24</p>
          </div>

          <div className="rounded-2xl border border-border bg-card px-4 py-3">
            <p className="mb-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="size-4" />
              文档总量
            </p>
            <p className="text-2xl font-semibold">8,972</p>
          </div>

          <div className="rounded-2xl border border-border bg-card px-4 py-3">
            <p className="mb-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Layers3 className="size-4" />
              索引任务
            </p>
            <p className="text-2xl font-semibold">13</p>
          </div>

          <div className="rounded-2xl border border-border bg-card px-4 py-3">
            <p className="mb-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="size-4" />
              协作成员
            </p>
            <p className="text-2xl font-semibold">37</p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.5fr_0.9fr]">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-sm">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="搜索知识库、标签或负责人" className="pl-8" />
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto">
                <Button variant="outline" size="sm">
                  <Filter className="size-4" />
                  筛选
                </Button>
                <Button variant="outline" size="sm">
                  <CalendarClock className="size-4" />
                  最近更新
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {knowledgeBases.map((kb) => (
                <article
                  key={kb.id}
                  className="rounded-xl border border-border bg-background p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h3 className="line-clamp-1 text-base font-medium">{kb.name}</h3>
                    <StatusBadge status={kb.status} />
                  </div>

                  <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                    {kb.description}
                  </p>

                  <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Globe2 className="size-3.5" />
                      来源 {kb.sourceCount}
                    </span>
                    <span className="text-border">/</span>
                    <span className="inline-flex items-center gap-1">
                      <BookOpenText className="size-3.5" />
                      文档 {kb.docCount}
                    </span>
                  </div>

                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {kb.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        <Tag className="size-3" />
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>负责人：{kb.owner}</span>
                    <span>{kb.updatedAt}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-3 text-sm font-medium">最近活动</h2>
              <div className="space-y-3">
                {recentActivities.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-lg border border-border bg-background px-3 py-2"
                  >
                    <p className="text-sm">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.actor} · {item.time}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-3 text-sm font-medium">待办建议</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="rounded-lg border border-border bg-background px-3 py-2">
                  为「客服知识库」补充近 30 天高频工单 FAQ
                </p>
                <p className="rounded-lg border border-border bg-background px-3 py-2">
                  清理「合规与法务资料」中过期附件并重新索引
                </p>
                <p className="rounded-lg border border-border bg-background px-3 py-2">
                  给「研发技术手册」添加版本维度标签
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
