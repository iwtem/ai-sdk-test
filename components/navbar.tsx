"use client";

import { Brain, Cpu, File, House, Library, MessageSquareText, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "~/lib/utils";

type MenuItem = {
  path: string;
  name: string;
  icon?: React.ComponentType<{ className?: string }>;
};

const menuItems: MenuItem[] = [
  { path: "/", name: "主页", icon: House },
  { path: "/datasets", name: "数据集", icon: Library },
  { path: "/chats", name: "聊天", icon: MessageSquareText },
  { path: "/agents", name: "智能体", icon: Cpu },
  { path: "/memories", name: "记忆", icon: Brain },
  { path: "/documents", name: "文档中心", icon: File },
];

function isPathActive(currentPath: string, itemPath: string) {
  if (itemPath === "/") return currentPath === "/";
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav>
      <ul className="flex items-center gap-1 rounded-full border border-border-button bg-bg-card p-1">
        {menuItems.map(({ path, name, icon: Icon }) => {
          const isActive = isPathActive(pathname, path);

          return (
            <li key={path}>
              <Link
                href={path}
                className={cn(
                  "inline-flex h-10 items-center justify-center gap-2 rounded-full px-6 text-base transition-colors",
                  "hover:text-current focus-visible:text-current",
                  isActive ? "bg-text-primary text-bg-base" : "text-muted-foreground",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {Icon && <Icon className="size-5" />}
                <span>{name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Navbar;
