import { useState, useEffect } from 'react';
import { Subscription, BillingPlatform, CancellationMethod, PLATFORM_CANCELLATION_INFO, getCancellationSteps, generateCancellationEmail, CancellationStep } from '@/types';
import { supabase } from '@/lib/supabase';
import { X, Zap, Compass, Mail, CheckCircle2, ArrowRight, ArrowLeft, Copy, Check, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

interface CancelModalProps {
  subscription: Subscription;
  onClose: () => void;
  onComplete: () => void;
}

export function CancelModal({ subscription, onClose, onComplete }: CancelModalProps) {
  const platform = subscription.billing_platform as BillingPlatform;
  const info = PLATFORM_CANCELLATION_INFO[platform];
  const [method, setMethod] = useState<CancellationMethod | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);

  const steps: CancellationStep[] = method ? getCancellationSteps(platform, subscription.name) : [];
  const emailContent = method === 'email' ? generateCancellationEmail(subscription.name, subscription.price, subscription.billing_cycle as 'monthly' | 'yearly') : null;

  useEffect(() => {
    if (info.auto) setMethod('auto');
  }, [info.auto]);

  const handleSelectMethod = async (m: CancellationMethod) => {
    setMethod(m);
    setError(null);
    if (m === 'auto') {
      await startAutoCancellation();
    }
  };

  const startAutoCancellation = async () => {
    setLoading(true);
    setError(null);
    try {
      // Update subscription status to cancelling
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelling', updated_at: new Date().toISOString() })
        .eq('id', subscription.id);
      if (subError) throw subError;

      // Create cancellation request record
      const { error: reqError } = await supabase
        .from('cancellation_requests')
        .insert({
          subscription_id: subscription.id,
          method: 'auto',
          status: 'in_progress',
        });
      if (reqError) throw reqError;

      // Simulate the auto-cancellation process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mark as completed
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', subscription.id);

      await supabase
        .from('cancellation_requests')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('subscription_id', subscription.id)
        .order('created_at', { ascending: false })
        .limit(1);

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleGuidedStep = async (action: 'next' | 'prev' | 'finish') => {
    if (action === 'prev') {
      setStepIndex(Math.max(0, stepIndex - 1));
      return;
    }
    if (action === 'next') {
      // Save progress
      if (stepIndex === 0) {
        await supabase.from('cancellation_requests').insert({
          subscription_id: subscription.id,
          method: 'guided',
          status: 'in_progress',
          steps: steps,
          current_step: 1,
        });
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelling', updated_at: new Date().toISOString() })
          .eq('id', subscription.id);
      } else {
        await supabase
          .from('cancellation_requests')
          .update({ current_step: stepIndex + 1 })
          .eq('subscription_id', subscription.id)
          .order('created_at', { ascending: false })
          .limit(1);
      }
      setStepIndex(stepIndex + 1);
      return;
    }
    if (action === 'finish') {
      setLoading(true);
      try {
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('id', subscription.id);

        await supabase
          .from('cancellation_requests')
          .update({ status: 'completed', completed_at: new Date().toISOString(), current_step: steps.length })
          .eq('subscription_id', subscription.id)
          .order('created_at', { ascending: false })
          .limit(1);

        setDone(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to complete cancellation');
      } finally {
        setLoading(false);
      }
    }
  };

  const copyEmail = () => {
    if (emailContent) {
      const text = `Subject: ${emailContent.subject}\n\n${emailContent.body}`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEmailGenerated = async () => {
    setLoading(true);
    try {
      await supabase.from('cancellation_requests').insert({
        subscription_id: subscription.id,
        method: 'email',
        status: 'in_progress',
        email_subject: emailContent?.subject ?? null,
        email_body: emailContent?.body ?? null,
      });
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelling', updated_at: new Date().toISOString() })
        .eq('id', subscription.id);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save cancellation request');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-lg font-bold text-slate-600">
              {subscription.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Cancel {subscription.name}</h2>
              <p className="text-xs text-slate-400">
                {subscription.billing_platform.replace('_', ' ')} · ${subscription.price.toFixed(2)}/{subscription.billing_cycle === 'monthly' ? 'mo' : 'yr'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {done ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {method === 'email' ? 'Cancellation email ready!' : 'Cancellation complete!'}
              </h3>
              <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
                {method === 'email'
                  ? 'We have saved your cancellation email. Send it to the merchant and your subscription will be cancelled.'
                  : `Your ${subscription.name} subscription has been marked as cancelled. You may still have access until the end of your current billing period.`}
              </p>
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 mb-6 inline-flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">
                  Estimated annual savings: ${subscription.billing_cycle === 'monthly' ? (subscription.price * 12).toFixed(2) : subscription.price.toFixed(2)}
                </span>
              </div>
              <div>
                <button
                  onClick={handleFinish}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/20"
                >
                  Done
                </button>
              </div>
            </div>
          ) : !method ? (
            /* Method selection */
            <div>
              <p className="text-sm text-slate-500 mb-4">
                Choose how you want to cancel your {subscription.name} subscription.
              </p>
              <div className="space-y-3">
                {info.auto && (
                  <MethodOption
                    icon={Zap}
                    title="Auto-Cancellation"
                    description="We will cancel this subscription for you automatically."
                    badge="Recommended"
                    badgeColor="emerald"
                    onClick={() => handleSelectMethod('auto')}
                  />
                )}
                <MethodOption
                  icon={Compass}
                  title="Guided Cancellation"
                  description="Step-by-step instructions to cancel through the billing platform."
                  badge={info.difficulty}
                  badgeColor={info.difficulty === 'Hard' ? 'amber' : 'slate'}
                  onClick={() => handleSelectMethod('guided')}
                />
                <MethodOption
                  icon={Mail}
                  title="Email Cancellation"
                  description="Generate a ready-to-send cancellation email to the merchant."
                  onClick={() => handleSelectMethod('email')}
                />
              </div>
            </div>
          ) : method === 'auto' ? (
            /* Auto cancellation */
            <div className="text-center py-8">
              {loading ? (
                <>
                  <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Cancelling your subscription...</h3>
                  <p className="text-sm text-slate-500">Contacting {subscription.name} and processing your cancellation request.</p>
                </>
              ) : error ? (
                <>
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Cancellation failed</h3>
                  <p className="text-sm text-slate-500 mb-4">{error}</p>
                  <button
                    onClick={() => { setMethod(null); setError(null); }}
                    className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
                  >
                    Try another method
                  </button>
                </>
              ) : null}
            </div>
          ) : method === 'guided' ? (
            /* Guided cancellation */
            <div>
              {/* Progress */}
              <div className="flex items-center gap-2 mb-6">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1.5 rounded-full transition-all ${i <= stepIndex ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Step {stepIndex + 1} of {steps.length}
              </p>

              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 mb-4">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{steps[stepIndex].title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{steps[stepIndex].description}</p>
                {steps[stepIndex].tip && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2">
                    <AlertCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-emerald-700">{steps[stepIndex].tip}</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600 mb-4">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => handleGuidedStep('prev')}
                  disabled={stepIndex === 0}
                  className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                {stepIndex < steps.length - 1 ? (
                  <button
                    onClick={() => handleGuidedStep('next')}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    Next Step
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleGuidedStep('finish')}
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        I have cancelled it
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ) : method === 'email' ? (
            /* Email cancellation */
            <div>
              <p className="text-sm text-slate-500 mb-4">
                Here is a ready-to-send cancellation email for {subscription.name}. Copy it and send it to the merchant's support or billing email.
              </p>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-500">Subject</span>
                  <button
                    onClick={copyEmail}
                    className="text-xs text-emerald-600 font-medium flex items-center gap-1.5 hover:text-emerald-700 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy email'}
                  </button>
                </div>
                <p className="text-sm font-medium text-slate-900 mb-3 pb-3 border-b border-slate-200">
                  {emailContent?.subject}
                </p>
                <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                  {emailContent?.body}
                </pre>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600 mb-4">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setMethod(null)}
                  className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleEmailGenerated}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      <Check className="w-4 h-4" />
                      I have sent the email
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MethodOption({
  icon: Icon,
  title,
  description,
  badge,
  badgeColor = 'slate',
  onClick,
}: {
  icon: typeof Zap;
  title: string;
  description: string;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'slate';
  onClick: () => void;
}) {
  const badgeStyles = {
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    slate: 'bg-slate-100 text-slate-600',
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-4 p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-left group"
    >
      <div className="w-11 h-11 rounded-xl bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center flex-shrink-0 transition-colors">
        <Icon className="w-5 h-5 text-slate-600 group-hover:text-emerald-600 transition-colors" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-slate-900">{title}</h4>
          {badge && (
            <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${badgeStyles[badgeColor]}`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </button>
  );
}
