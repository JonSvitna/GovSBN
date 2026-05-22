"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Filter, AlertTriangle, MapPin, Calendar } from "lucide-react";
import { SeverityBadge, StatusBadge, EmptyState } from "@/components/ui";
import { formatRelativeTime } from "@/lib/utils";

export function FindingsClient({ findings }: { findings: any[] }) {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = findings.filter((f) => {
    const matchSearch = !search || f.title?.toLowerCase().includes(search.toLowerCase()) || f.site?.name?.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = severityFilter === "all" || f.severity === severityFilter;
    const matchStatus = statusFilter === "all" || f.status === statusFilter;
    return matchSearch && matchSeverity && matchStatus;
  });

  const openCount = findings.filter((f) => f.status === "open").length;
  const criticalCount = findings.filter((f) => f.severity === "critical").length;

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Findings</h1>
          <p className="text-sm text-slate-500 mt-1">
            {openCount} open · {criticalCount} critical
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: findings.length, color: "bg-slate-50 text-slate-700" },
          { label: "Open", value: findings.filter(f => f.status === "open").length, color: "bg-red-50 text-red-700" },
          { label: "In Progress", value: findings.filter(f => f.status === "in_progress").length, color: "bg-yellow-50 text-yellow-700" },
          { label: "Resolved", value: findings.filter(f => f.status === "resolved").length, color: "bg-green-50 text-green-700" },
        ].map((stat) => (
          <div key={stat.label} className={`card p-4 ${stat.color}`}>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search findings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <div className="flex gap-2">
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="input w-auto">
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto">
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
            <option value="waived">Waived</option>
          </select>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="w-6 h-6" />}
          title="No findings found"
          description={findings.length === 0 ? "Findings are automatically generated when inspections identify issues." : "No findings match your current filters."}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((finding, idx) => (
            <motion.div
              key={finding.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.3 }}
            >
              <Link
                href={`/findings/${finding.id}`}
                className="card p-5 flex items-start justify-between hover:border-slate-300 transition-all group block"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0 ${
                    finding.severity === "critical" ? "bg-red-500" :
                    finding.severity === "high" ? "bg-orange-400" :
                    finding.severity === "medium" ? "bg-yellow-400" :
                    "bg-blue-400"
                  }`} />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">
                      {finding.title}
                    </p>
                    {finding.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{finding.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      {finding.site && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <MapPin className="w-3 h-3" />{finding.site.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar className="w-3 h-3" />{formatRelativeTime(finding.created_at)}
                      </span>
                      {finding.due_date && (
                        <span className="text-xs text-slate-400">Due: {finding.due_date}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0 ml-3">
                  <SeverityBadge severity={finding.severity} />
                  <StatusBadge status={finding.status} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
