"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Search, Filter, ClipboardList, MapPin, Calendar, User } from "lucide-react";
import { StatusBadge, EmptyState } from "@/components/ui";
import { formatDate, formatRelativeTime } from "@/lib/utils";

interface InspectionsClientProps {
  inspections: any[];
  sites: any[];
  templates: any[];
}

export function InspectionsClient({ inspections, sites, templates }: InspectionsClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = inspections.filter((i) => {
    const matchSearch =
      !search ||
      i.template?.name?.toLowerCase().includes(search.toLowerCase()) ||
      i.site?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inspections</h1>
          <p className="text-sm text-slate-500 mt-1">{inspections.length} total inspections</p>
        </div>
        <Link href="/inspections/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          New Inspection
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search inspections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="in_progress">In Progress</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-6 h-6" />}
          title="No inspections found"
          description={
            inspections.length === 0
              ? "Start your first inspection to get going."
              : "No inspections match your filters."
          }
          action={
            inspections.length === 0 ? (
              <Link href="/inspections/new" className="btn-primary">
                <Plus className="w-4 h-4" />
                New Inspection
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((inspection, idx) => (
            <motion.div
              key={inspection.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.3 }}
            >
              <Link
                href={`/inspections/${inspection.id}`}
                className="card p-5 flex items-start justify-between hover:border-slate-300 transition-all group block"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">
                      {inspection.template?.name || "Inspection"}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      {inspection.site && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="w-3 h-3" />
                          {inspection.site.name}
                          {inspection.site.city && `, ${inspection.site.city}`}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {formatRelativeTime(inspection.created_at)}
                      </span>
                      {inspection.inspector && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <User className="w-3 h-3" />
                          {inspection.inspector.full_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-slate-400 hidden sm:block">
                    {inspection.template?.category}
                  </span>
                  <StatusBadge status={inspection.status} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
