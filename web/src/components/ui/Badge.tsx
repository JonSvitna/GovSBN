import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "muted";
  size?: "sm" | "md";
  className?: string;
}

const variants = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-800",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  muted: "bg-slate-100 text-slate-500",
};

export function Badge({ children, variant = "default", size = "md", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium rounded-lg",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
    critical: { label: "Critical", variant: "danger" },
    high: { label: "High", variant: "warning" },
    medium: { label: "Medium", variant: "info" },
    low: { label: "Low", variant: "default" },
    info: { label: "Info", variant: "muted" },
  };
  const cfg = map[severity?.toLowerCase()] ?? { label: severity, variant: "default" };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
    open: { label: "Open", variant: "danger" },
    in_progress: { label: "In Progress", variant: "warning" },
    resolved: { label: "Resolved", variant: "success" },
    completed: { label: "Completed", variant: "success" },
    closed: { label: "Closed", variant: "muted" },
    overdue: { label: "Overdue", variant: "danger" },
    draft: { label: "Draft", variant: "muted" },
    submitted: { label: "Submitted", variant: "info" },
    under_review: { label: "Under Review", variant: "info" },
    approved: { label: "Approved", variant: "success" },
    rejected: { label: "Rejected", variant: "danger" },
    pending: { label: "Pending", variant: "warning" },
    verified: { label: "Verified", variant: "success" },
    waived: { label: "Waived", variant: "muted" },
  };
  const cfg = map[status?.toLowerCase()] ?? { label: status?.replace(/_/g, " ") ?? "", variant: "default" };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
