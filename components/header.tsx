"use client";

import { CircleHelp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import Navbar from "./navbar";

export function Header({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  return (
    <header
      key="app-navbar"
      className={cn(
        "w-full grid grid-cols-[1fr_auto_1fr] grid-rows-1 items-center gap-8",
        className,
      )}
      {...props}
    >
      <div className="inline-flex items-center">
        <Link href="/" aria-current={pathname === "/" ? "page" : undefined}>
          <Image src="/vercel.svg" alt="Site logo" width={40} height={40} />
        </Link>
      </div>

      <Navbar />

      <div
        className="flex items-center justify-end gap-4 text-text-badge"
        data-testid="auth-status"
      >
        <a
          className="p-2 text-text-secondary hover:text-text-primary focus-visible:text-text-primary"
          target="_blank"
          href="https://discord.com/invite/NjYzJD3GM3"
          rel="noreferrer noopener"
        >
          Discord
        </a>

        <a
          className="p-2 text-text-secondary hover:text-text-primary focus-visible:text-text-primary"
          target="_blank"
          href="https://github.com/infiniflow/ragflow"
          rel="noreferrer noopener"
        >
          GitHub
        </a>

        <Button asChild variant="ghost" size="icon">
          <a
            href="https://ragflow.io/docs/dev/category/user-guides"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Open documentation"
          >
            <CircleHelp className="size-[1em]" />
          </a>
        </Button>
      </div>
    </header>
  );
}
