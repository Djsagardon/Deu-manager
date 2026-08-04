import React from 'react';
import {
  LayoutDashboard,
  Users,
  BadgeIndianRupee,
  FileSpreadsheet,
  Settings,
  Plus
} from 'lucide-react';

interface AndroidBottomNavProps {
  activeTab: 'dashboard' | 'customers' | 'claims' | 'reports' | 'settings' | 'subscription';
  setActiveTab: (tab: 'dashboard' | 'customers' | 'claims' | 'reports' | 'settings' | 'subscription') => void;
  pendingClaimsCount: number;
  onOpenAddTransaction: () => void;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({
  activeTab,
  setActiveTab,
  pendingClaimsCount,
  onOpenAddTransaction,
}) => {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 shadow-2xl px-2 py-1.5 transition-colors">
      <div className="max-w-lg mx-auto flex items-center justify-between relative">
        {/* Dashboard Tab */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 flex flex-col items-center py-1 px-0.5 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <div
            className={`p-1.5 rounded-full transition-all ${
              activeTab === 'dashboard'
                ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400'
                : ''
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 font-medium">Dashboard</span>
        </button>

        {/* Customers Tab */}
        <button
          onClick={() => setActiveTab('customers')}
          className={`flex-1 flex flex-col items-center py-1 px-0.5 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'customers'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <div
            className={`p-1.5 rounded-full transition-all ${
              activeTab === 'customers'
                ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400'
                : ''
            }`}
          >
            <Users className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 font-medium">Customers</span>
        </button>

        {/* Floating Action Button (FAB) for quick loan/payment transaction */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={onOpenAddTransaction}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-xl shadow-indigo-600/40 flex items-center justify-center active:scale-90 transition-transform cursor-pointer border-2 border-white dark:border-slate-900"
            title="New Entry (Loan / Payment)"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Loans / Claims Tab */}
        <button
          onClick={() => setActiveTab('claims')}
          className={`flex-1 flex flex-col items-center py-1 px-0.5 rounded-2xl transition-all cursor-pointer relative ${
            activeTab === 'claims'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <div
            className={`p-1.5 rounded-full transition-all relative ${
              activeTab === 'claims'
                ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400'
                : ''
            }`}
          >
            <BadgeIndianRupee className="w-5 h-5" />
            {pendingClaimsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">
                {pendingClaimsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 font-medium">Loans</span>
        </button>

        {/* Reports Tab */}
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 flex flex-col items-center py-1 px-0.5 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'reports'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <div
            className={`p-1.5 rounded-full transition-all ${
              activeTab === 'reports'
                ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400'
                : ''
            }`}
          >
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 font-medium">Reports</span>
        </button>

        {/* Settings Tab */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex flex-col items-center py-1 px-0.5 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <div
            className={`p-1.5 rounded-full transition-all ${
              activeTab === 'settings'
                ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400'
                : ''
            }`}
          >
            <Settings className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
};

