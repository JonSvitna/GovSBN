"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, CheckSquare, Calendar, User, AlertCircle } from "lucide-react";
import { StatusBadge, SeverityBadge, EmptyState } from "@/components/ui";
import { formatDate, formatRelativeTime } from "@/lib/utils";

interface Props {
  actions: any[];
  currentUserId: string;
}

export function CorrectiveActionsClient({ actions, currentUserId }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [myActions, setMyActions] = useState(false);

  const filtered = actions.filter((a) => {
    const matchSearch = !search || a.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const matchMine = !myActions || a.assigned_to === currentUserId;
    return matchSearch && matchStatus && matchMine;
  });

  const overdueCount = actions.filter((a) => a.status === "overdue").length;
  const pendingCount = actions.filter((a) => a.status === "pending").length;
  const completedCount = actions.filter((a) => a.status === "completed" || a.status === "verified").length;

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Corrective Actions</h1>
          <p className="text-sm text-slate-500 mt-1">
            {overdueCount > 0 && <span className="text-red-600 font-medium">{overdueCount} overdue · </span>}
            {pendingCount} pending · {completedCount} completed
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: actions.length, className: "bg-slate-50" },
          { label: "Overdue", value: overdueCount, className: "bg-red-50" },
          { label: "Pending", value: pendingCount, className: "bg-yellow-50" },
          { label: "Completed", value: completedCount, className: "bg-green-50" },
        ].map((stat) => (
          <div key={stat.label} className={`card p-4 ${stat.className}`}>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search corrective actions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="verified">Verified</option>
          <option value="overdue">Overdue</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={myActions}
            onChange={(e) => setMyActions(e.target.checked)}
            className="rounded"
          />
          My actions only
        </label>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-6 h-6" />}
          title="No corrective actions found"
          description="Corrective actions are automatically created when findings are generated during inspections."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((action, idx) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.3 }}
            >
              <Link
                href={`/corrective-actions/${action.id}`}
                className="card p-5 flex items-start justify-between hover:border-slate-300 transition-all group block"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    action.status === "overdue" ? "bg-red-50" :
                    action.status === "completed" || action.status === "verified" ? "bg-green-50" :
                    "bg-blue-50"
                  }`}>
                    <CheckSquare className={`w-5 h-5 ${
                      action.status === "overdue" ? "text-red-500" :
                      action.status === "completed" || action.status === "verified" ? "text-green-500" :
                      "text-blue-500"
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">
                      {action.title}
                    </p>
                    {action.finding && (
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Finding: {action.finding.title}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      {action.assignee && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <User className="w-3 h-3" />{action.assignee.full_name}
                        </span>
                      )}
                      {action.due_date && (
                        <span className={`flex items-center gap-1 text-xs ${
                          new Date(action.due_date) < new Date() && action.status !== "completed"
                            ? "text-red-500 font-medium"
                            : "text-slate-400"
                        }`}>
                          <Calendar className="w-3 h-3" />
                          Due: {formatDate(action.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <SeverityBadge severity={action.priority} />
                  <StatusBadge status={action.status} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
