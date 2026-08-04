import React, { useState } from 'react';
import { X, Building2, Lock, Mail, User, Phone, ShieldCheck, Sparkles, ArrowRight, Store, KeyRound, AlertCircle } from 'lucide-react';
import { UserProfile, TenantWorkspace, UserRole, SubscriptionPlan } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (userProfile: UserProfile, tenant: TenantWorkspace) => void;
  plans: SubscriptionPlan[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  plans,
}) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('plan_trial');
  const [isSuperAdminLogin, setIsSuperAdminLogin] = useState(false);

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      // Create new tenant workspace ID
      const tenantId = `tenant_${Date.now()}`;
      const uid = `user_${Date.now()}`;

      const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

      const newTenant: TenantWorkspace = {
        id: tenantId,
        companyName,
        ownerName,
        ownerEmail: email,
        phone,
        planId: selectedPlan?.id || 'plan_trial',
        planName: selectedPlan?.name || 'Free Trial',
        status: 'TRIAL',
        customerLimit: selectedPlan?.customerLimit ?? 15,
        loanLimit: selectedPlan?.loanLimit ?? 50,
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
        createdAt: new Date().toISOString(),
        currency: '₹',
        isSetupComplete: false,
      };

      const newUser: UserProfile = {
        uid,
        email,
        name: ownerName,
        role: 'COMPANY_ADMIN',
        tenantId,
        phone,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };

      onLoginSuccess(newUser, newTenant);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter email and password.');
      return;
    }

    setLoading(true);

    try {
      if (isSuperAdminLogin || email.toLowerCase().includes('admin')) {
        const adminUser: UserProfile = {
          uid: 'super_admin_001',
          email: email || 'admin@duemanager.saas',
          name: 'Super Admin',
          role: 'SUPER_ADMIN',
          tenantId: 'platform_admin',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        };

        const adminTenant: TenantWorkspace = {
          id: 'platform_admin',
          companyName: 'Due Manager SaaS Platform',
          ownerName: 'Super Admin',
          ownerEmail: email,
          phone: '+1 800 555 0199',
          planId: 'plan_premium',
          planName: 'Platform Super Admin',
          status: 'ACTIVE',
          customerLimit: -1,
          loanLimit: -1,
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          currency: '₹',
          isSetupComplete: true,
        };

        onLoginSuccess(adminUser, adminTenant);
        onClose();
        return;
      }

      // Demo or Existing Company Login
      const tenantId = `tenant_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const uid = `user_${Date.now()}`;

      const mockTenant: TenantWorkspace = {
        id: tenantId,
        companyName: companyName || 'My Business Store',
        ownerName: ownerName || email.split('@')[0],
        ownerEmail: email,
        phone: phone || '+91 98765 43210',
        planId: 'plan_standard',
        planName: 'Standard Business',
        status: 'ACTIVE',
        customerLimit: 250,
        loanLimit: -1,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        currency: '₹',
        isSetupComplete: true,
      };

      const userProfile: UserProfile = {
        uid,
        email,
        name: ownerName || email.split('@')[0],
        role: 'COMPANY_ADMIN',
        tenantId,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };

      onLoginSuccess(userProfile, mockTenant);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (role: 'COMPANY_ADMIN' | 'SUPER_ADMIN') => {
    if (role === 'SUPER_ADMIN') {
      const adminUser: UserProfile = {
        uid: 'super_admin_001',
        email: 'superadmin@duemanager.saas',
        name: 'Platform Super Admin',
        role: 'SUPER_ADMIN',
        tenantId: 'platform_admin',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };

      const adminTenant: TenantWorkspace = {
        id: 'platform_admin',
        companyName: 'Due Manager SaaS Platform',
        ownerName: 'Platform Owner',
        ownerEmail: 'superadmin@duemanager.saas',
        phone: '+1 800 555 0199',
        planId: 'plan_premium',
        planName: 'Enterprise SaaS Owner',
        status: 'ACTIVE',
        customerLimit: -1,
        loanLimit: -1,
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        currency: '₹',
        isSetupComplete: true,
      };

      onLoginSuccess(adminUser, adminTenant);
    } else {
      const demoTenantId = 'tenant_demo_store';
      const demoUser: UserProfile = {
        uid: 'user_demo_001',
        email: 'store_owner@demo.com',
        name: 'Demo Store Owner',
        role: 'COMPANY_ADMIN',
        tenantId: demoTenantId,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };

      const demoTenant: TenantWorkspace = {
        id: demoTenantId,
        companyName: 'Sagar Traders & Enterprise',
        ownerName: 'Demo Store Owner',
        ownerEmail: 'store_owner@demo.com',
        phone: '+91 98765 43210',
        planId: 'plan_standard',
        planName: 'Standard Business',
        status: 'ACTIVE',
        customerLimit: 250,
        loanLimit: -1,
        validUntil: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        currency: '₹',
        isSetupComplete: true,
      };

      onLoginSuccess(demoUser, demoTenant);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white backdrop-blur-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-blue-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" /> Multi-Tenant SaaS Engine
              </span>
              <h2 className="text-xl font-black">
                {mode === 'REGISTER'
                  ? 'Create Business Workspace'
                  : mode === 'FORGOT'
                  ? 'Reset SaaS Password'
                  : 'SaaS Account Login'}
              </h2>
            </div>
          </div>
          <p className="text-xs text-blue-100/90 leading-relaxed">
            {mode === 'REGISTER'
              ? 'Provision a dedicated isolated ledger workspace for your store or company.'
              : 'Sign in to manage customers, ledger transactions, UPI payments, and reminders.'}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-2xl text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              {errorMsg}
            </div>
          )}

          {mode === 'REGISTER' ? (
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Store Name *
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apex Traders Pvt Ltd"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Owner Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Sagar Patel"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@company.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Plan Tier
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold dark:text-white"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ${p.priceMonthly}/mo ({p.customerLimit === -1 ? 'Unlimited' : p.customerLimit} Customers)
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Register Business & Provision SaaS</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : mode === 'LOGIN' ? (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="store_owner@company.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold dark:text-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode('FORGOT')}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  id="superAdminLogin"
                  checked={isSuperAdminLogin}
                  onChange={(e) => setIsSuperAdminLogin(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="superAdminLogin" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  Login as SaaS Platform Super Admin
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Sign In to SaaS Workspace</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-xs">
              <p className="text-slate-500 leading-relaxed">
                Enter your registered business email address. We will send you an automated password reset verification link.
              </p>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@company.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  alert('Password reset link sent to your email address!');
                  setMode('LOGIN');
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
              >
                Send Password Reset Email
              </button>
            </div>
          )}

          {/* Quick Demo Switcher Box */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              ⚡ Instant 1-Click Sandbox Demos
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('COMPANY_ADMIN')}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-[11px] transition-colors flex items-center justify-center gap-1.5"
              >
                <Store className="w-3.5 h-3.5 text-indigo-500" />
                Company Workspace Demo
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('SUPER_ADMIN')}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-bold rounded-xl text-[11px] border border-amber-200 dark:border-amber-800 transition-colors flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                Super Admin Panel Demo
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          {mode === 'LOGIN' ? (
            <p className="text-slate-500 font-medium">
              Don't have a business workspace yet?{' '}
              <button
                onClick={() => setMode('REGISTER')}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Register Company
              </button>
            </p>
          ) : (
            <p className="text-slate-500 font-medium">
              Already registered?{' '}
              <button
                onClick={() => setMode('LOGIN')}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
