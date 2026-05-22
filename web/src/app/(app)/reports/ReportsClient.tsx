"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Download, TrendingUp, CheckCircle2, AlertTriangle, Clock, FileText } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { StatCard } from "@/components/ui";
import { formatDate } from "@/lib/utils";

interface Props {
  stats: {
    totalInspections: number;
    totalFindings: number;
    openFindings: number;
    resolvedFindings: number;
    totalActions: number;
    completedActions: number;
    overdueActions: number;
  };
  findingsBySeverity: any[];
  inspectionsByStatus: any[];
  recentActivity: any[];
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#3b82f6",
  info: "#94a3b8",
};

const STATUS_COLORS: Record<string, string> = {
  approved: "#22c55e",
  submitted: "#3b82f6",
  under_review: "#8b5cf6",
  in_progress: "#eab308",
  draft: "#94a3b8",
  rejected: "#ef4444",
};

function groupBy<T>(arr: T[], key: keyof T): Record<string, number> {
  return arr.reduce((acc, item) => {
    const k = String(item[key] ?? "unknown");
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export function ReportsClient({ stats, findingsBySeverity, inspectionsByStatus, recentActivity }: Props) {
  const [exportLoading, setExportLoading] = useState(false);

  const severityData = Object.entries(groupBy(findingsBySeverity, "severity")).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: SEVERITY_COLORS[name] ?? "#94a3b8",
  }));

  const statusData = Object.entries(groupBy(inspectionsByStatus, "status")).map(([name, value]) => ({
    name: name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    value,
    color: STATUS_COLORS[name] ?? "#94a3b8",
  }));

  const completionRate = stats.totalActions > 0
    ? Math.round((stats.completedActions / stats.totalActions) * 100)
    : 0;

  const resolutionRate = stats.totalFindings > 0
    ? Math.round((stats.resolvedFindings / stats.totalFindings) * 100)
    : 0;

  const handleExportCSV = () => {
    setExportLoading(true);
    const headers = ["Date", "Template", "Site", "Status"];
    const rows = recentActivity.map((i) => [
      formatDate(i.created_at),
      i.template?.name || "",
      i.site?.name || "",
      i.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inspection-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportLoading(false);
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Operational intelligence and Power BI-ready exports</p>
        </div>
        <button onClick={handleExportCSV} disabled={exportLoading} className="btn-secondary">
          <Download className="w-4 h-4" />
          {exportLoading ? "Exporting..." : "Export CSV"}
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Inspections" value={stats.totalInspections} icon={<FileText className="w-5 h-5" />} color="blue" />
        <StatCard label="Open Findings" value={stats.openFindings} icon={<AlertTriangle className="w-5 h-5" />} color={stats.openFindings > 0 ? "red" : "green"} />
        <StatCard label="Action Completion" value={`${completionRate}%`} icon={<CheckCircle2 className="w-5 h-5" />} color="green" change={`${stats.completedActions} of ${stats.totalActions} complete`} changeType="neutral" />
        <StatCard label="Finding Resolution" value={`${resolutionRate}%`} icon={<TrendingUp className="w-5 h-5" />} color="blue" change={`${stats.resolvedFindings} of ${stats.totalFindings} resolved`} changeType="neutral" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Findings by Severity */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Findings by Severity</h2>
          </div>
          {severityData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">No findings data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={severityData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {severityData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [value, "Findings"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Inspections by Status */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Inspections by Status</h2>
          </div>
          {statusData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">No inspection data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" name="Inspections" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Operational Summary */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {[
          {
            title: "Overdue Corrective Actions",
            value: stats.overdueActions,
            color: stats.overdueActions > 0 ? "text-red-600" : "text-green-600",
            desc: stats.overdueActions === 0 ? "All corrective actions on track" : "Actions past their due date",
            icon: <Clock className="w-5 h-5" />,
            bg: stats.overdueActions > 0 ? "bg-red-50" : "bg-green-50",
          },
          {
            title: "Pending Review",
            value: inspectionsByStatus.filter((i: any) => i.status === "submitted").length,
            color: "text-blue-600",
            desc: "Inspections awaiting manager review",
            icon: <FileText className="w-5 h-5" />,
            bg: "bg-blue-50",
          },
          {
            title: "Total Active Issues",
            value: stats.openFindings + stats.overdueActions,
            color: "text-orange-600",
            desc: "Open findings and overdue actions combined",
            icon: <AlertTriangle className="w-5 h-5" />,
            bg: "bg-orange-50",
          },
        ].map((item) => (
          <div key={item.title} className="card p-6">
            <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-4`}>
              <span className={item.color}>{item.icon}</span>
            </div>
            <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-sm font-medium text-slate-900 mt-1">{item.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Export Options */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Download className="w-4 h-4 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Power BI Export Options</h2>
        </div>
        <p className="text-sm text-slate-500 mb-5">
          Download normalized datasets ready for Power BI, Excel, or other analytics platforms. All data is pre-tagged with reporting metadata, category classifications, and field mappings.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Inspections Report", desc: "All inspection records with metadata", format: "CSV" },
            { label: "Findings Report", desc: "Finding trends by severity and category", format: "CSV" },
            { label: "Corrective Actions Report", desc: "Action status and completion tracking", format: "CSV" },
          ].map((exp) => (
            <div key={exp.label} className="border border-slate-200 rounded-xl p-4">
              <p className="font-medium text-sm text-slate-900">{exp.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{exp.desc}</p>
              <button onClick={handleExportCSV} className="btn-secondary mt-3 text-xs px-3 py-1.5 gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Export {exp.format}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
