"use client";
import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui";

interface TopBarProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function TopBar({ title, subtitle, action }: TopBarProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        {action && (
          <Button size="sm" onClick={action.onClick}>
            <Plus className="w-4 h-4" />
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
