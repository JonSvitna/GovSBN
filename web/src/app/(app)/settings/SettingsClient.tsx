"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Building2, Users, MapPin, Save, Plus, Check } from "lucide-react";
import { Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface Props {
  profile: any;
  organization: any;
  members: any[];
  sites: any[];
}

type Tab = "profile" | "organization" | "team" | "sites";

export function SettingsClient({ profile, organization, members, sites }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [orgName, setOrgName] = useState(organization?.name || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteCity, setNewSiteCity] = useState("");
  const [newSiteState, setNewSiteState] = useState("");
  const [addingSite, setAddingSite] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSaveProfile = async () => {
    setSaving(true);
    await supabase.from("profiles").update({ full_name: fullName }).eq("id", profile.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  };

  const handleSaveOrg = async () => {
    setSaving(true);
    await supabase.from("organizations").update({ name: orgName }).eq("id", organization.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  };

  const handleAddSite = async () => {
    if (!newSiteName.trim()) return;
    setAddingSite(true);
    await supabase.from("sites").insert({
      organization_id: organization.id,
      name: newSiteName,
      city: newSiteCity || null,
      state: newSiteState || null,
      active: true,
    });
    setNewSiteName("");
    setNewSiteCity("");
    setNewSiteState("");
    setAddingSite(false);
    router.refresh();
  };

  const tabs = [
    { id: "profile" as Tab, label: "Profile", icon: User },
    { id: "organization" as Tab, label: "Organization", icon: Building2 },
    { id: "team" as Tab, label: "Team", icon: Users },
    { id: "sites" as Tab, label: "Sites", icon: MapPin },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account, organization, and platform configuration</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-brand-600" : "text-slate-400"}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6 max-w-lg">
              <h2 className="font-semibold text-slate-900 mb-5">Profile Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Full name</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Email address</label>
                  <input type="email" value={profile?.email || ""} className="input bg-slate-50" readOnly />
                  <p className="text-xs text-slate-400 mt-1.5">Email cannot be changed here</p>
                </div>
                <div>
                  <label className="label">Role</label>
                  <input type="text" value={profile?.role || ""} className="input bg-slate-50 capitalize" readOnly />
                </div>
                <button onClick={handleSaveProfile} disabled={saving} className="btn-primary">
                  {saved ? <><Check className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" />{saving ? "Saving..." : "Save Profile"}</>}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === "organization" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6 max-w-lg">
              <h2 className="font-semibold text-slate-900 mb-5">Organization Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Organization name</label>
                  <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Plan</label>
                  <input type="text" value={organization?.plan || "starter"} className="input bg-slate-50 capitalize" readOnly />
                </div>
                <div>
                  <label className="label">Organization ID</label>
                  <input type="text" value={organization?.id || ""} className="input bg-slate-50 font-mono text-xs" readOnly />
                </div>
                <button onClick={handleSaveOrg} disabled={saving} className="btn-primary">
                  {saved ? <><Check className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" />{saving ? "Saving..." : "Save Organization"}</>}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === "team" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6">
              <h2 className="font-semibold text-slate-900 mb-5">Team Members ({members.length})</h2>
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                        <span className="text-xs font-semibold text-brand-700">
                          {member.full_name?.charAt(0) || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{member.full_name}</p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </div>
                    </div>
                    <Badge variant="default" className="capitalize">{member.role}</Badge>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "sites" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="card p-6">
                <h2 className="font-semibold text-slate-900 mb-5">Sites & Locations ({sites.length})</h2>
                <div className="space-y-2 mb-5">
                  {sites.map((site) => (
                    <div key={site.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{site.name}</p>
                          {(site.city || site.state) && (
                            <p className="text-xs text-slate-500">{[site.city, site.state].filter(Boolean).join(", ")}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant={site.active ? "success" : "muted"}>
                        {site.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                  {sites.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">No sites added yet.</p>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Add New Site</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        value={newSiteName}
                        onChange={(e) => setNewSiteName(e.target.value)}
                        className="input"
                        placeholder="Site name *"
                      />
                    </div>
                    <input
                      type="text"
                      value={newSiteCity}
                      onChange={(e) => setNewSiteCity(e.target.value)}
                      className="input"
                      placeholder="City"
                    />
                    <input
                      type="text"
                      value={newSiteState}
                      onChange={(e) => setNewSiteState(e.target.value)}
                      className="input"
                      placeholder="State"
                    />
                    <button
                      onClick={handleAddSite}
                      disabled={addingSite || !newSiteName.trim()}
                      className="btn-primary justify-center"
                    >
                      <Plus className="w-4 h-4" />
                      {addingSite ? "Adding..." : "Add Site"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
