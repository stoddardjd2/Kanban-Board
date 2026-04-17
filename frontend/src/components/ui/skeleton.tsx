import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--radius-sm)] bg-[rgb(var(--muted))]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
