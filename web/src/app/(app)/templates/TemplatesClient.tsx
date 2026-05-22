"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Search, FileText, Layers } from "lucide-react";
import { Badge, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export function TemplatesClient({ templates, userRole }: { templates: any[]; userRole: string }) {
  const [search, setSearch] = useState("");

  const filtered = templates.filter((t) =>
    !search || t.name?.toLowerCase().includes(search.toLowerCase())
  );

  const canCreate = ["admin", "manager"].includes(userRole);

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inspection Templates</h1>
          <p className="text-sm text-slate-500 mt-1">{templates.length} templates</p>
        </div>
        {canCreate && (
          <Link href="/templates/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            New Template
          </Link>
        )}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-6 h-6" />}
          title="No templates found"
          description="Templates define the questions and structure for your inspections."
          action={
            canCreate ? (
              <Link href="/templates/new" className="btn-primary">
                <Plus className="w-4 h-4" />
                Create Template
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((template, idx) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
            >
              <Link
                href={`/templates/${template.id}`}
                className="card p-5 hover:border-slate-300 transition-all group block h-full"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <Badge variant={template.is_active ? "success" : "muted"}>
                    {template.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <h3 className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">
                  {template.name}
                </h3>
                {template.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{template.description}</p>
                )}
                <div className="flex items-center gap-3 mt-3">
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Layers className="w-3 h-3" />
                    {template.sections?.length || 0} sections
                  </span>
                  <span className="text-xs text-slate-400 capitalize">{template.category}</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">
                    {template.creator?.full_name || "System"}
                  </span>
                  <span className="text-xs text-slate-400">{formatDate(template.created_at)}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
