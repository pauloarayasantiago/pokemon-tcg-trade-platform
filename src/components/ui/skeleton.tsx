import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/40 relative overflow-hidden", className)}
      style={{
        backgroundImage: "linear-gradient(to right, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite linear",
      }}
      {...props}
    />
  )
}

export { Skeleton } 