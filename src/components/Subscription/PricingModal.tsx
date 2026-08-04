import React, { useState } from 'react';
import { X, Check, Zap, Sparkles, Shield, ArrowRight, Star, CreditCard, Building2 } from 'lucide-react';
import { SubscriptionPlan, TenantWorkspace } from '../../types';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: SubscriptionPlan[];
  currentTenant: TenantWorkspace | null;
  onSelectPlanForCheckout: (plan: SubscriptionPlan, billingCycle: 'monthly' | 'yearly') => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  plans,
  currentTenant,
  onSelectPlanForCheckout,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 relative flex flex-col items-center text-center">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-extrabold text-[10px] uppercase tracking-widest rounded-full mb-3 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Enterprise SaaS Subscriptions
          </span>

          <h2 className="text-2xl font-black text-white">
            Choose the Perfect Plan for {currentTenant?.companyName || 'Your Business'}
          </h2>
          <p className="text-slate-400 text-xs mt-1 max-w-xl leading-relaxed">
            Scalable multi-tenant ledger software. Upgrade anytime to increase customer capacity, unlock automated WhatsApp reminders, and enable multi-staff access.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="mt-5 flex items-center gap-3 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/60">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Yearly Billing
              <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-black text-[9px] rounded-full uppercase">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950/40">
          {plans.map((plan) => {
            const isCurrent = currentTenant?.planId === plan.id;
            const price = billingCycle === 'yearly' ? Math.round(plan.priceYearly / 12) : plan.priceMonthly;

            return (
              <div
                key={plan.id}
                className={`relative bg-white dark:bg-slate-900 border rounded-3xl p-5 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all ${
                  plan.isPopular
                    ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-full shadow-md flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-300 text-amber-300" /> Most Popular
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">{plan.name}</h3>
                    {isCurrent && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold rounded-md">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">₹{price}</span>
                      <span className="text-xs font-semibold text-slate-400">/ month</span>
                    </div>
                    {billingCycle === 'yearly' && plan.priceYearly > 0 && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Billed annually (₹{plan.priceYearly}/yr)
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3 mb-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Included Capacity:
                    </span>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      {plan.customerLimit === -1 ? 'Unlimited' : plan.customerLimit} Customer Accounts
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      {plan.loanLimit === -1 ? 'Unlimited' : plan.loanLimit} Transactions / Month
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Features:
                    </span>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => onSelectPlanForCheckout(plan, billingCycle)}
                    disabled={isCurrent}
                    className={`w-full py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isCurrent
                        ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                        : plan.isPopular
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white'
                    }`}
                  >
                    {isCurrent ? (
                      'Current Active Plan'
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                        <span>Upgrade Workspace</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer Guarantee */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Encrypted payment processing • Instant tier activation</span>
          </div>
          <button
            onClick={onClose}
            className="font-bold text-slate-700 dark:text-slate-300 hover:underline"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
