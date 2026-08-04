import React, { useState } from 'react';
import {
  Building2,
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Search,
  CheckCircle2,
  XCircle,
  Megaphone,
  Sliders,
  Trash2,
  Edit,
  Plus,
  RefreshCw,
  X,
  Sparkles,
  Download,
  Lock
} from 'lucide-react';
import { TenantWorkspace, SubscriptionPlan, Invoice, Announcement } from '../../types';

interface SuperAdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tenants: TenantWorkspace[];
  plans: SubscriptionPlan[];
  invoices: Invoice[];
  announcements: Announcement[];
  onUpdateTenantStatus: (tenantId: string, status: TenantWorkspace['status']) => void;
  onUpdateTenantPlan: (tenantId: string, planId: string) => void;
  onDeleteTenant: (tenantId: string) => void;
  onSavePlan: (plan: SubscriptionPlan) => void;
  onCreateAnnouncement: (title: string, content: string) => void;
}

export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({
  isOpen,
  onClose,
  tenants,
  plans,
  invoices,
  announcements,
  onUpdateTenantStatus,
  onUpdateTenantPlan,
  onDeleteTenant,
  onSavePlan,
  onCreateAnnouncement,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TENANTS' | 'PLANS' | 'INVOICES' | 'ANNOUNCEMENTS'>('OVERVIEW');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  // Announcement Form
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');

  if (!isOpen) return null;

  const filteredTenants = tenants.filter(
    (t) =>
      t.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phone.includes(searchQuery)
  );

  const totalRevenue = invoices.reduce((acc, inv) => acc + (inv.amount || 0), 0);
  const activeTenantsCount = tenants.filter((t) => t.status === 'ACTIVE' || t.status === 'TRIAL').length;

  const handleSavePlanForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlan) {
      onSavePlan(editingPlan);
      setEditingPlan(null);
    }
  };

  const handleAnnouncementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (announcementTitle && announcementContent) {
      onCreateAnnouncement(announcementTitle, announcementContent);
      setAnnouncementTitle('');
      setAnnouncementContent('');
      alert('System announcement broadcasted to all company workspaces successfully!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl h-[90vh] overflow-hidden shadow-2xl flex flex-col text-slate-100 animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">Super Admin Control Panel</h2>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                  SaaS Master Access
                </span>
              </div>
              <p className="text-xs text-slate-400">Global multi-tenant platform analytics & tenant management</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-900/90 px-6 py-2 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'OVERVIEW' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Platform Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('TENANTS')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'TENANTS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Tenants ({tenants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('PLANS')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'PLANS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>SaaS Subscription Plans</span>
          </button>

          <button
            onClick={() => setActiveTab('INVOICES')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'INVOICES' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Billing & Invoices</span>
          </button>

          <button
            onClick={() => setActiveTab('ANNOUNCEMENTS')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'ANNOUNCEMENTS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Broadcast Announcements</span>
          </button>
        </div>

        {/* Content Views */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Metric Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2 font-bold">
                    <span>Registered Companies</span>
                    <Building2 className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-3xl font-black text-white">{tenants.length}</div>
                  <div className="text-[11px] text-emerald-400 font-semibold mt-1">
                    {activeTenantsCount} Active / In Trial
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2 font-bold">
                    <span>Platform Subscription Revenue</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-black text-emerald-400">${totalRevenue}</div>
                  <div className="text-[11px] text-slate-400 font-semibold mt-1">
                    {invoices.length} Total Processed Payments
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2 font-bold">
                    <span>Active Subscription Plans</span>
                    <Sliders className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-black text-amber-300">{plans.length}</div>
                  <div className="text-[11px] text-slate-400 font-semibold mt-1">Configured Pricing Tiers</div>
                </div>

                <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2 font-bold">
                    <span>System Health & Firebase</span>
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-xl font-black text-emerald-400 flex items-center gap-1.5 mt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    Operational 100%
                  </div>
                  <div className="text-[11px] text-slate-400 font-semibold mt-1">Multi-Tenant Isolated Database</div>
                </div>
              </div>

              {/* Tenant Quick Overview List */}
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-400" />
                    Recently Provisioned Workspaces
                  </h3>
                  <button
                    onClick={() => setActiveTab('TENANTS')}
                    className="text-xs font-bold text-indigo-400 hover:underline"
                  >
                    Manage All Tenants →
                  </button>
                </div>

                <div className="divide-y divide-slate-800">
                  {tenants.slice(0, 5).map((tenant) => (
                    <div key={tenant.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white text-sm">{tenant.companyName}</div>
                        <div className="text-slate-400 text-[11px]">
                          Owner: {tenant.ownerName} ({tenant.ownerEmail})
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold rounded-lg text-[10px]">
                          {tenant.planName}
                        </span>
                        <span
                          className={`px-2.5 py-1 font-bold rounded-lg text-[10px] uppercase ${
                            tenant.status === 'ACTIVE'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : tenant.status === 'SUSPENDED'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {tenant.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'TENANTS' && (
            <div className="space-y-4">
              {/* Search bar */}
              <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search companies by name, email, or phone..."
                  className="bg-transparent border-none text-xs text-white focus:outline-none w-full"
                />
              </div>

              {/* Tenants Table */}
              <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4">Company & Owner</th>
                      <th className="p-4">Active Plan</th>
                      <th className="p-4">Limits (Cust/Txn)</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Expiry Date</th>
                      <th className="p-4 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {filteredTenants.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-white text-sm">{t.companyName}</div>
                          <div className="text-slate-400 text-[11px]">{t.ownerEmail} • {t.phone}</div>
                        </td>

                        <td className="p-4">
                          <select
                            value={t.planId}
                            onChange={(e) => onUpdateTenantPlan(t.id, e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-white font-bold rounded-xl px-2.5 py-1 text-xs"
                          >
                            {plans.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (${p.priceMonthly}/mo)
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="p-4 text-slate-300 font-bold">
                          {t.customerLimit === -1 ? 'Unlimited' : t.customerLimit} C / {t.loanLimit === -1 ? 'Unlimited' : t.loanLimit} T
                        </td>

                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 font-bold rounded-lg text-[10px] uppercase ${
                              t.status === 'ACTIVE'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : t.status === 'SUSPENDED'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>

                        <td className="p-4 text-slate-400 text-[11px]">
                          {new Date(t.validUntil).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>

                        <td className="p-4 text-right space-x-2">
                          {t.status === 'SUSPENDED' ? (
                            <button
                              onClick={() => onUpdateTenantStatus(t.id, 'ACTIVE')}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[10px]"
                            >
                              Activate
                            </button>
                          ) : (
                            <button
                              onClick={() => onUpdateTenantStatus(t.id, 'SUSPENDED')}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-[10px]"
                            >
                              Suspend
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (confirm(`Permanently delete company workspace ${t.companyName}?`)) {
                                onDeleteTenant(t.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg"
                            title="Delete Workspace"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'PLANS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {plans.map((p) => (
                  <div key={p.id} className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-white text-base">{p.name}</h4>
                      <button
                        onClick={() => setEditingPlan(p)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-2xl font-black text-indigo-400">
                      ${p.priceMonthly} <span className="text-xs font-semibold text-slate-400">/mo</span>
                    </div>

                    <div className="text-xs text-slate-300 font-bold space-y-1 border-t border-slate-800 pt-2">
                      <div>Capacity: {p.customerLimit === -1 ? 'Unlimited' : p.customerLimit} Customers</div>
                      <div>Transactions: {p.loanLimit === -1 ? 'Unlimited' : p.loanLimit} / mo</div>
                    </div>
                  </div>
                ))}
              </div>

              {editingPlan && (
                <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
                  <h4 className="font-bold text-white text-sm flex items-center justify-between">
                    <span>Edit Plan Config: {editingPlan.name}</span>
                    <button onClick={() => setEditingPlan(null)} className="text-slate-400">
                      <X className="w-4 h-4" />
                    </button>
                  </h4>

                  <form onSubmit={handleSavePlanForm} className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-400 mb-1">Plan Name</label>
                      <input
                        type="text"
                        value={editingPlan.name}
                        onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-400 mb-1">Monthly Price ($)</label>
                      <input
                        type="number"
                        value={editingPlan.priceMonthly}
                        onChange={(e) => setEditingPlan({ ...editingPlan, priceMonthly: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-400 mb-1">Customer Limit (-1 = ∞)</label>
                      <input
                        type="number"
                        value={editingPlan.customerLimit}
                        onChange={(e) => setEditingPlan({ ...editingPlan, customerLimit: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                      />
                    </div>

                    <div className="col-span-3 flex justify-end">
                      <button
                        type="submit"
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                      >
                        Save Plan Changes
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {activeTab === 'INVOICES' && (
            <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Invoice ID</th>
                    <th className="p-4">Company</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Plan</th>
                    <th className="p-4">Gateway Ref</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="p-4 font-mono font-bold text-indigo-400">{inv.id}</td>
                      <td className="p-4 font-bold text-white">{inv.companyName}</td>
                      <td className="p-4 font-extrabold text-emerald-400">{inv.currency}{inv.amount}</td>
                      <td className="p-4 font-bold text-slate-300">{inv.planName}</td>
                      <td className="p-4 font-mono text-slate-400 text-[11px]">{inv.transactionRef}</td>
                      <td className="p-4 text-slate-400">
                        {new Date(inv.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'ANNOUNCEMENTS' && (
            <div className="space-y-6">
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
                <h4 className="font-bold text-white text-base flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-amber-400" />
                  Broadcast Global Platform Announcement
                </h4>

                <form onSubmit={handleAnnouncementSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Announcement Title</label>
                    <input
                      type="text"
                      required
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      placeholder="e.g. Scheduled System Upgrade & WhatsApp Integration Feature Release"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Message Body</label>
                    <textarea
                      rows={3}
                      required
                      value={announcementContent}
                      onChange={(e) => setAnnouncementContent(e.target.value)}
                      placeholder="Enter broadcast message details that appear in company admin notification centers..."
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-lg flex items-center gap-2"
                  >
                    <Megaphone className="w-4 h-4" />
                    Publish Broadcast Announcement
                  </button>
                </form>
              </div>

              {/* Announcements History */}
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-sm">Published Announcements</h4>
                <div className="space-y-2">
                  {announcements.map((a) => (
                    <div key={a.id} className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-xs">
                      <div className="font-bold text-amber-300 text-sm">{a.title}</div>
                      <p className="text-slate-300 mt-1">{a.content}</p>
                      <div className="text-[10px] text-slate-500 mt-2">
                        Broadcasted on {new Date(a.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
