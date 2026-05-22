import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ children, className, padding = "md" }: CardProps) {
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };
  return (
    <div className={cn("card", paddings[padding], className)}>
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
  color?: "blue" | "green" | "yellow" | "red" | "slate";
}

const colorMap = {
  blue: { bg: "bg-blue-50", icon: "text-blue-600" },
  green: { bg: "bg-green-50", icon: "text-green-600" },
  yellow: { bg: "bg-yellow-50", icon: "text-yellow-600" },
  red: { bg: "bg-red-50", icon: "text-red-600" },
  slate: { bg: "bg-slate-100", icon: "text-slate-600" },
};

export function StatCard({ label, value, change, changeType = "neutral", icon, color = "blue" }: StatCardProps) {
  const colors = colorMap[color];
  return (
    <div className="card p-6 flex items-start gap-4">
      {icon && (
        <div className={cn("p-2.5 rounded-xl", colors.bg)}>
          <span className={colors.icon}>{icon}</span>
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm text-slate-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
        {change && (
          <p className={cn(
            "text-xs mt-1",
            changeType === "positive" ? "text-green-600" :
            changeType === "negative" ? "text-red-600" :
            "text-slate-500"
          )}>
            {change}
          </p>
        )}
      </div>
    </div>
  );
}
