import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  Building2,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  Phone
} from 'lucide-react';
import { DueManagerLogo } from '../DueManagerLogo';
import { UserProfile, TenantWorkspace, SubscriptionPlan } from '../../types';
import {
  registerWithEmail,
  loginWithEmail,
  sendVerificationEmailToUser,
  sendPasswordResetLink,
  formatFirebaseAuthError,
  auth,
  db
} from '../../utils/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface EmailAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: SubscriptionPlan[];
  existingTenants: TenantWorkspace[];
  onLoginSuccess: (userProfile: UserProfile, tenant: TenantWorkspace) => void;
}

type AuthMode = 'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD' | 'VERIFY_PENDING';

export const EmailAuthModal: React.FC<EmailAuthModalProps> = ({
  isOpen,
  onClose,
  plans,
  existingTenants,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Pending Verification State
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const resetFormState = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowSignUpPrompt(false);
    setLoading(false);
  };

  // Switch Auth Mode
  const switchMode = (newMode: AuthMode) => {
    resetFormState();
    setMode(newMode);
  };

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!companyName.trim()) {
      setErrorMsg('Please enter your Company / Store Name.');
      return;
    }
    if (!ownerName.trim()) {
      setErrorMsg('Please enter the Owner Name.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Please enter your Mobile Number.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-check.');
      return;
    }

    setLoading(true);

    try {
      // 1. Firebase Create Account
      const userCred = await registerWithEmail(email, password);
      const user = userCred.user;
      const uid = user.uid;
      const tenantId = `tenant_${uid}`;

      // 2. Prepare Tenant Workspace & User Profile
      const trialValidUntil = new Date(
        Date.now() + 15 * 24 * 60 * 60 * 1000
      ).toISOString();

      const newTenant: TenantWorkspace = {
        id: tenantId,
        companyName: companyName.trim(),
        ownerName: ownerName.trim(),
        ownerEmail: email.trim().toLowerCase(),
        phone: phone.trim(),
        planId: 'plan_trial',
        planName: '15-Day Free Trial',
        status: 'ACTIVE',
        customerLimit: 50,
        loanLimit: 100,
        validUntil: trialValidUntil,
        createdAt: new Date().toISOString(),
        currency: '₹',
        isSetupComplete: true,
      };

      const newProfile: UserProfile = {
        uid: uid,
        email: email.trim().toLowerCase(),
        name: ownerName.trim(),
        role: 'COMPANY_ADMIN',
        tenantId: tenantId,
        phone: phone.trim(),
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };

      // Save to Firestore (Isolated by UID)
      try {
        await setDoc(doc(db, 'tenants', tenantId), newTenant);
        await setDoc(doc(db, 'users', uid), newProfile);
      } catch (fsErr) {
        console.warn('Firestore profile write note:', fsErr);
      }

      // 3. Send Email Verification
      await sendVerificationEmailToUser(user);

      setPendingEmail(email.trim().toLowerCase());
      setPendingUser(user);
      setSuccessMsg(`Account created! A verification link was sent to ${email.trim()}.`);
      setMode('VERIFY_PENDING');
    } catch (err: any) {
      console.error('Registration Error:', err);
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

      // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const userCred = await loginWithEmail(normalizedEmail, password);
      const user = userCred.user;

      // Check if email is verified
      if (!user.emailVerified) {
        setPendingEmail(user.email || normalizedEmail);
        setPendingUser(user);
        setErrorMsg('Email verification is required before accessing your workspace.');
        setMode('VERIFY_PENDING');
        setLoading(false);
        return;
      }

      // Fetch or build user profile & tenant workspace
      const uid = user.uid;
      const tenantId = `tenant_${uid}`;

      let fetchedTenant: TenantWorkspace | null = null;
      let fetchedProfile: UserProfile | null = null;

      try {
        const tenantSnap = await getDoc(doc(db, 'tenants', tenantId));
        if (tenantSnap.exists()) {
          fetchedTenant = tenantSnap.data() as TenantWorkspace;
        }

        const profileSnap = await getDoc(doc(db, 'users', uid));
        if (profileSnap.exists()) {
          fetchedProfile = profileSnap.data() as UserProfile;
        }
      } catch (e) {
        console.warn('Firestore fetch note:', e);
      }

      // Fallback workspace if not yet in firestore
      if (!fetchedTenant) {
        fetchedTenant = {
          id: tenantId,
          companyName: user.displayName || 'Store Workspace',
          ownerName: user.displayName || user.email?.split('@')[0] || 'Store Owner',
          ownerEmail: user.email || normalizedEmail,
          phone: '',
          planId: 'plan_trial',
          planName: '15-Day Free Trial',
          status: 'ACTIVE',
          customerLimit: 50,
          loanLimit: 100,
          validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          currency: '₹',
          isSetupComplete: true,
        };
      }

      if (!fetchedProfile) {
        fetchedProfile = {
          uid: uid,
          email: user.email || normalizedEmail,
          name: fetchedTenant.ownerName,
          role: 'COMPANY_ADMIN',
          tenantId: tenantId,
          phone: '',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        };
      }

      onLoginSuccess(fetchedProfile, fetchedTenant);
      onClose();
    } catch (err: any) {
      console.error('Login Error:', err);
      const formatted = formatFirebaseAuthError(err);
      setErrorMsg(formatted);
      if (
        err?.code === 'auth/invalid-credential' ||
        err?.code === 'auth/user-not-found' ||
        err?.code === 'auth/wrong-password'
      ) {
        setShowSignUpPrompt(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Check Email Verification Status
  const handleCheckVerificationStatus = async () => {
    resetFormState();
    setLoading(true);

    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          const uid = auth.currentUser.uid;
          const tenantId = `tenant_${uid}`;

          let fetchedTenant: TenantWorkspace | null = null;
          let fetchedProfile: UserProfile | null = null;

          try {
            const tenantSnap = await getDoc(doc(db, 'tenants', tenantId));
            if (tenantSnap.exists()) fetchedTenant = tenantSnap.data() as TenantWorkspace;
            const profileSnap = await getDoc(doc(db, 'users', uid));
            if (profileSnap.exists()) fetchedProfile = profileSnap.data() as UserProfile;
          } catch (e) {
            console.warn('Firestore fetch note:', e);
          }

          if (!fetchedTenant) {
            fetchedTenant = {
              id: tenantId,
              companyName: companyName || 'Store Workspace',
              ownerName: ownerName || 'Store Owner',
              ownerEmail: pendingEmail,
              phone: '',
              planId: 'plan_trial',
              planName: '15-Day Free Trial',
              status: 'ACTIVE',
              customerLimit: 50,
              loanLimit: 100,
              validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
              createdAt: new Date().toISOString(),
              currency: '₹',
              isSetupComplete: true,
            };
          }

          if (!fetchedProfile) {
            fetchedProfile = {
              uid: uid,
              email: pendingEmail,
              name: fetchedTenant.ownerName,
              role: 'COMPANY_ADMIN',
              tenantId: tenantId,
              status: 'ACTIVE',
              createdAt: new Date().toISOString(),
            };
          }

          setSuccessMsg('Email verified successfully! Opening your dashboard...');
          setTimeout(() => {
            onLoginSuccess(fetchedProfile!, fetchedTenant!);
            onClose();
          }, 800);
          return;
        }
      }
      setErrorMsg('Email not verified yet. Please click the link sent to your email inbox.');
    } catch (err: any) {
      setErrorMsg('Failed to check status. Please try logging in with your email & password.');
    } finally {
      setLoading(false);
    }
  };

  // Resend Email Verification
  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    resetFormState();
    setLoading(true);

    try {
      if (pendingUser || auth.currentUser) {
        const u = pendingUser || auth.currentUser;
        await sendVerificationEmailToUser(u);
        setSuccessMsg(`Verification email resent to ${pendingEmail || u.email}.`);
        setResendCooldown(60);
      } else {
        setErrorMsg('User session expired. Please attempt to log in again.');
      }
    } catch (err: any) {
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetLink(email);
      setSuccessMsg(`Password reset link sent to ${email.trim()}. Please check your email inbox.`);
    } catch (err: any) {
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col transition-all">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-950 text-white relative flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-md flex items-center justify-center">
              <DueManagerLogo variant="icon" iconOnlySize={36} />
            </div>
            <div>
              <h2 className="font-black text-base leading-tight tracking-wide flex items-center gap-1">
                <span>Due</span><span className="text-emerald-400">Manager</span>
              </h2>
              <p className="text-[11px] text-indigo-200/80 font-semibold">
                {mode === 'LOGIN' && 'Secure Store Login'}
                {mode === 'SIGNUP' && 'Create Store Account'}
                {mode === 'FORGOT_PASSWORD' && 'Reset Password'}
                {mode === 'VERIFY_PENDING' && 'Email Verification Required'}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-indigo-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-2xl text-rose-700 dark:text-rose-300 font-semibold space-y-2">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
              {showSignUpPrompt && mode === 'LOGIN' && (
                <button
                  type="button"
                  onClick={() => switchMode('SIGNUP')}
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm mt-1"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Click Here to Create Account for {email.trim() || 'Your Store'}</span>
                </button>
              )}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* MODE: LOGIN */}
          {mode === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="store.owner@gmail.com"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode('FORGOT_PASSWORD')}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                  />
                  <span>Remember Me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black rounded-2xl shadow-lg transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Log In to Store</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Don't have a store account? </span>
                <button
                  type="button"
                  onClick={() => switchMode('SIGNUP')}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Create Store Account
                </button>
              </div>
            </form>
          )}

          {/* MODE: SIGNUP */}
          {mode === 'SIGNUP' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Company / Store Name *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., Sagar Traders & Enterprise"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Owner Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g., Ramesh Kumar"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="store.owner@gmail.com"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span>Includes 15-Day Free Trial with full ledger capabilities & WhatsApp reminders.</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white font-black rounded-2xl shadow-lg transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Create Account & Send Verification Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Already registered? </span>
                <button
                  type="button"
                  onClick={() => switchMode('LOGIN')}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Log In Here
                </button>
              </div>
            </form>
          )}

          {/* MODE: VERIFY_PENDING */}
          {mode === 'VERIFY_PENDING' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
                <Mail className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Email Verification Required
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
                  We have sent a verification link to{' '}
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {pendingEmail || email}
                  </span>
                  . Please open your email inbox and click the verification link to activate your store workspace.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleCheckVerificationStatus}
                  disabled={loading}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black rounded-2xl shadow-md transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>I Have Verified - Check Status</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={loading || resendCooldown > 0}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-slate-200 font-bold rounded-2xl transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>
                    {resendCooldown > 0
                      ? `Resend Link in ${resendCooldown}s`
                      : 'Resend Verification Email'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => switchMode('LOGIN')}
                  className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:underline pt-1 cursor-pointer block mx-auto"
                >
                  Return to Login
                </button>
              </div>
            </div>
          )}

          {/* MODE: FORGOT_PASSWORD */}
          {mode === 'FORGOT_PASSWORD' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Enter your registered store email address below. We will send you a link to reset your password securely.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="store.owner@gmail.com"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black rounded-2xl shadow-lg transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Send Password Reset Link</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => switchMode('LOGIN')}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
