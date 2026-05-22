import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date) {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return formatDate(date);
}

export function getSeverityColor(severity: string) {
  switch (severity?.toLowerCase()) {
    case "critical": return "bg-red-100 text-red-700";
    case "high": return "bg-orange-100 text-orange-700";
    case "medium": return "bg-yellow-100 text-yellow-700";
    case "low": return "bg-blue-100 text-blue-700";
    default: return "bg-slate-100 text-slate-700";
  }
}

export function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "open": return "bg-red-100 text-red-700";
    case "in_progress": return "bg-yellow-100 text-yellow-700";
    case "resolved":
    case "completed":
    case "approved": return "bg-green-100 text-green-700";
    case "closed": return "bg-slate-100 text-slate-600";
    case "overdue": return "bg-red-100 text-red-800";
    case "draft": return "bg-slate-100 text-slate-600";
    case "submitted":
    case "under_review": return "bg-blue-100 text-blue-700";
    default: return "bg-slate-100 text-slate-700";
  }
}

export function getStatusLabel(status: string) {
  return status?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) ?? "";
}
