import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export default function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <header className="flex-shrink-0 border-b bg-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {children}
        </div>
      </div>
    </header>
  );
}
