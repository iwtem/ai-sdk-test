interface DocumentHeaderProps {
  title: string;
  description: string;
  extra?: React.ReactNode;
}

export function DocumentHeader({ title, description, extra }: DocumentHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <h1 className="font-semibold text-3xl tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      {extra && (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {extra}
        </div>
      )}
    </header>
  );
}
