"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ClipboardList, AlertTriangle, CheckSquare, Clock,
  ArrowRight, Plus, TrendingUp, Activity
} from "lucide-react";
import { StatCard, StatusBadge, SeverityBadge } from "@/components/ui";
import { formatRelativeTime } from "@/lib/utils";

interface DashboardClientProps {
  profile: any;
  stats: {
    totalInspections: number;
    openFindings: number;
    overdueActions: number;
    pendingReview: number;
  };
  recentInspections: any[];
  recentFindings: any[];
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export function DashboardClient({ profile, stats, recentInspections, recentFindings }: DashboardClientProps) {
  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const orgName = profile?.organization?.name || "Your Organization";

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Header */}
      <motion.div variants={item} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Good morning, {firstName}</h1>
          <p className="text-sm text-slate-500 mt-1">{orgName} · Operational Dashboard</p>
        </div>
        <Link href="/inspections/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          New Inspection
        </Link>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Inspections"
          value={stats.totalInspections}
          icon={<ClipboardList className="w-5 h-5" />}
          color="blue"
          change="All time"
          changeType="neutral"
        />
        <StatCard
          label="Open Findings"
          value={stats.openFindings}
          icon={<AlertTriangle className="w-5 h-5" />}
          color={stats.openFindings > 0 ? "red" : "green"}
          change={stats.openFindings === 0 ? "All clear" : "Requires attention"}
          changeType={stats.openFindings === 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Overdue Actions"
          value={stats.overdueActions}
          icon={<CheckSquare className="w-5 h-5" />}
          color={stats.overdueActions > 0 ? "yellow" : "green"}
          change={stats.overdueActions === 0 ? "On track" : "Past due date"}
          changeType={stats.overdueActions === 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Pending Review"
          value={stats.pendingReview}
          icon={<Clock className="w-5 h-5" />}
          color="slate"
          change="Awaiting approval"
          changeType="neutral"
        />
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Inspections */}
        <motion.div variants={item} className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />
              <h2 className="font-semibold text-slate-900">Recent Inspections</h2>
            </div>
            <Link href="/inspections" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentInspections.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No inspections yet</p>
              <Link href="/inspections/new" className="text-xs text-brand-600 mt-1 inline-block">
                Start your first inspection
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentInspections.map((inspection) => (
                <Link
                  key={inspection.id}
                  href={`/inspections/${inspection.id}`}
                  className="flex items-start justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate group-hover:text-brand-700">
                      {inspection.template?.name || "Inspection"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {inspection.site?.name} · {formatRelativeTime(inspection.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={inspection.status} />
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Findings */}
        <motion.div variants={item} className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <h2 className="font-semibold text-slate-900">Recent Findings</h2>
            </div>
            <Link href="/findings" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentFindings.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No findings recorded</p>
              <p className="text-xs text-slate-400 mt-1">Findings are generated automatically during inspections</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentFindings.map((finding) => (
                <Link
                  key={finding.id}
                  href={`/findings/${finding.id}`}
                  className="flex items-start justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate group-hover:text-brand-700">
                      {finding.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {finding.site?.name} · {formatRelativeTime(finding.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <SeverityBadge severity={finding.severity} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={item} className="card p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/inspections/new", icon: ClipboardList, label: "New Inspection", color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
            { href: "/findings", icon: AlertTriangle, label: "Review Findings", color: "bg-orange-50 text-orange-700 hover:bg-orange-100" },
            { href: "/corrective-actions", icon: CheckSquare, label: "Corrective Actions", color: "bg-green-50 text-green-700 hover:bg-green-100" },
            { href: "/reports", icon: TrendingUp, label: "View Reports", color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors text-center ${action.color}`}
            >
              <action.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{action.label}</span>
            </Link>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
