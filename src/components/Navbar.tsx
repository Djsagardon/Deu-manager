import React from 'react';
import { MapPin, Bell } from 'lucide-react';
import { AppSettings, UserProfile, TenantWorkspace } from '../types';
import { DueManagerLogo } from './DueManagerLogo';

interface NavbarProps {
  activeTab: 'dashboard' | 'customers' | 'claims' | 'reports' | 'settings' | 'subscription';
  setActiveTab: (tab: 'dashboard' | 'customers' | 'claims' | 'reports' | 'settings' | 'subscription') => void;
  settings: AppSettings;
  pendingClaimsCount: number;
  unreadNotificationsCount?: number;
  userProfile: UserProfile | null;
  currentTenant: TenantWorkspace | null;
  onOpenSettings: () => void;
  onOpenSetupWizard: () => void;
  onOpenAddCustomer: () => void;
  onOpenAddTransaction: () => void;
  onOpenAuthModal: () => void;
  onOpenPricingModal: () => void;
  onOpenSuperAdmin: () => void;
  onOpenNotifications: () => void;
  onOpenInvoices: () => void;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  isOnline?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  currentTenant,
  unreadNotificationsCount = 0,
  onOpenNotifications,
}) => {
  const companyName = currentTenant?.companyName || 'My Business Store';
  const address = currentTenant?.address || settings.country || 'Main Commercial Market';

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-white shadow-md transition-colors">
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Official Small App Logo */}
            <div className="p-1.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl shadow-sm shrink-0 flex items-center justify-center">
              <DueManagerLogo variant="icon" iconOnlySize={32} />
            </div>
            
            <div className="min-w-0 flex-1">
              {/* Application Name with Logo Accent */}
              <div className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span>Due Manager</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>

              {/* Company / Store Name */}
              <h1 className="font-extrabold text-white text-base leading-tight truncate">
                {companyName}
              </h1>

              {/* Company Address */}
              <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="truncate">{address}</span>
              </p>
            </div>
          </div>

          {/* Notification Center Bell Action */}
          <button
            onClick={onOpenNotifications}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-2xl transition-all relative flex-shrink-0 cursor-pointer border border-slate-700"
            title="Notification Center"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

