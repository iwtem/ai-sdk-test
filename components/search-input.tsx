"use client";

import { Search } from "lucide-react";
import { debounce, useQueryState } from "nuqs";

import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

interface SearchInputProps extends React.ComponentProps<"input"> {
  queryKey?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export function SearchInput(props: SearchInputProps) {
  const {
    queryKey = "q",
    placeholder = "输入关键词检索",
    className,
    inputClassName,
    ...restProps
  } = props;

  const [query, setQuery] = useQueryState(queryKey, {
    defaultValue: "",
    limitUrlUpdates: debounce(300),
  });

  return (
    <div className={cn("relative w-full items-center gap-2 sm:max-w-52", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        className={cn("w-full pl-8", inputClassName)}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        {...restProps}
      />
    </div>
  );
}
