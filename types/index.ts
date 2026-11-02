export type BillingPlatform = 'direct' | 'apple' | 'google_play' | 'amazon' | 'paypal' | 'roku';

export type BillingCycle = 'monthly' | 'yearly';

export type SubscriptionStatus = 'active' | 'cancelling' | 'cancelled';

export type CancellationMethod = 'auto' | 'guided' | 'email';

export type CancellationStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  category: string;
  billing_platform: BillingPlatform;
  price: number;
  currency: string;
  billing_cycle: BillingCycle;
  next_renewal_date: string | null;
  status: SubscriptionStatus;
  logo_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CancellationStep {
  title: string;
  description: string;
  tip?: string;
}

export interface CancellationRequest {
  id: string;
  user_id: string;
  subscription_id: string;
  method: CancellationMethod;
  status: CancellationStatus;
  email_subject: string | null;
  email_body: string | null;
  steps: CancellationStep[] | null;
  current_step: number;
  created_at: string;
  completed_at: string | null;
}

export interface NewSubscription {
  name: string;
  category: string;
  billing_platform: BillingPlatform;
  price: number;
  currency: string;
  billing_cycle: BillingCycle;
  next_renewal_date: string | null;
  logo_url?: string | null;
  notes?: string | null;
}

export const BILLING_PLATFORMS: { value: BillingPlatform; label: string; icon: string }[] = [
  { value: 'direct', label: 'Direct Merchant', icon: 'CreditCard' },
  { value: 'apple', label: 'Apple App Store', icon: 'Apple' },
  { value: 'google_play', label: 'Google Play Store', icon: 'Play' },
  { value: 'amazon', label: 'Amazon', icon: 'ShoppingCart' },
  { value: 'paypal', label: 'PayPal', icon: 'Wallet' },
  { value: 'roku', label: 'Roku', icon: 'Tv' },
];

export const CATEGORIES: string[] = [
  'Streaming',
  'Music',
  'Productivity',
  'Cloud Storage',
  'Gaming',
  'News',
  'Fitness',
  'Education',
  'Software',
  'AI Tools',
  'VPN & Security',
  'Other',
];

export const PLATFORM_CANCELLATION_INFO: Record<BillingPlatform, { auto: boolean; difficulty: string; description: string }> = {
  direct: {
    auto: true,
    difficulty: 'Easy',
    description: 'Direct billing can often be cancelled automatically through the merchant API.',
  },
  apple: {
    auto: false,
    difficulty: 'Medium',
    description: 'Apple subscriptions must be cancelled through your Apple ID settings on iPhone, iPad, or Mac.',
  },
  google_play: {
    auto: false,
    difficulty: 'Medium',
    description: 'Google Play subscriptions must be cancelled through the Play Store app or web browser.',
  },
  amazon: {
    auto: false,
    difficulty: 'Medium',
    description: 'Amazon subscriptions are managed in your Amazon account under Memberships and Subscriptions.',
  },
  paypal: {
    auto: false,
    difficulty: 'Hard',
    description: 'PayPal recurring payments require cancelling the pre-approved payment plan in your PayPal account.',
  },
  roku: {
    auto: false,
    difficulty: 'Hard',
    description: 'Roku channel subscriptions must be managed through your Roku account or device settings.',
  },
};

export function getCancellationSteps(platform: BillingPlatform, name: string): CancellationStep[] {
  switch (platform) {
    case 'apple':
      return [
        { title: 'Open Settings', description: 'On your iPhone or iPad, open the Settings app.', tip: 'Look for the gear icon on your home screen.' },
        { title: 'Tap Your Name', description: `Tap your name and Apple ID at the top of Settings.` },
        { title: 'Go to Subscriptions', description: 'Tap "Subscriptions" to see all your active and expired subscriptions.' },
        { title: `Find ${name}`, description: `Locate ${name} in your active subscriptions list and tap it.` },
        { title: 'Cancel Subscription', description: 'Tap "Cancel Subscription" at the bottom of the screen and confirm.', tip: 'You will still have access until the current billing period ends.' },
      ];
    case 'google_play':
      return [
        { title: 'Open Play Store', description: 'Open the Google Play Store app on your Android device or visit play.google.com on a browser.' },
        { title: 'Check Account', description: 'Make sure you are signed in to the correct Google account that has the subscription.' },
        { title: 'Go to Payments & Subscriptions', description: 'Tap your profile icon, then select "Payments and subscriptions".' },
        { title: `Find ${name}`, description: `Select "Subscriptions" and locate ${name} in the list.` },
        { title: 'Cancel Subscription', description: 'Tap "Cancel subscription" and follow the prompts to confirm.', tip: 'Your subscription stays active until the end of the current billing cycle.' },
      ];
    case 'amazon':
      return [
        { title: 'Go to Amazon Account', description: 'Visit amazon.com and sign in to your account.' },
        { title: 'Navigate to Memberships', description: 'Hover over "Accounts & Lists" and click "Memberships & Subscriptions".' },
        { title: `Find ${name}`, description: `Locate ${name} in your active subscriptions list.` },
        { title: 'Cancel', description: 'Click "Cancel" next to the subscription and confirm your cancellation.', tip: 'Amazon may try to offer you a discount to stay — you can decline and continue cancelling.' },
      ];
    case 'paypal':
      return [
        { title: 'Log in to PayPal', description: 'Visit paypal.com and sign in to your account.' },
        { title: 'Go to Payment Settings', description: 'Click the gear icon (Settings), then select "Payments" > "Manage pre-approved payments".' },
        { title: `Find ${name}`, description: `Locate the pre-approved payment for ${name} in the list of merchants.` },
        { title: 'Cancel the Agreement', description: 'Click the merchant name, then click "Cancel" to stop future payments.', tip: 'Also check if you need to cancel directly with the merchant to avoid being billed through another method.' },
      ];
    case 'roku':
      return [
        { title: 'Go to Roku Account', description: 'Visit my.roku.com on a web browser and sign in.' },
        { title: 'Manage Subscriptions', description: 'Click on "Manage your subscriptions" under the My Account page.' },
        { title: `Find ${name}`, description: `Locate ${name} in your active channel subscriptions.` },
        { title: 'Cancel Channel', description: 'Click "Cancel subscription" next to the channel and confirm.', tip: 'You can also cancel directly from your Roku device under Settings > Subscriptions.' },
      ];
    case 'direct':
    default:
      return [
        { title: `Log in to ${name}`, description: `Visit the ${name} website and sign in to your account.` },
        { title: 'Find Account Settings', description: 'Navigate to your account settings or billing page. Look for "Subscription", "Billing", or "Plan" sections.' },
        { title: 'Cancel Subscription', description: 'Look for a "Cancel", "Downgrade", or "Manage Plan" option and follow the prompts to cancel.', tip: 'Some services make this hard to find — check the footer, account settings, or billing section.' },
        { title: 'Confirm Cancellation', description: 'Confirm the cancellation and save any confirmation email you receive.', tip: 'Keep the confirmation email as proof of cancellation in case you are charged again.' },
      ];
  }
}

export function generateCancellationEmail(name: string, price: number, cycle: BillingCycle): { subject: string; body: string } {
  const subject = `Cancellation Request — ${name} Subscription`;
  const body = `Dear ${name} Customer Support,

I am writing to request the cancellation of my ${name} subscription effective immediately. 

Subscription details:
- Service: ${name}
- Current charge: $${price.toFixed(2)} per ${cycle === 'monthly' ? 'month' : 'year'}
- Reason for cancellation: No longer needed

Please confirm:
1. That my subscription has been cancelled and no further charges will be applied.
2. The date through which I will continue to have access to the service.
3. That no early termination or cancellation fees apply.

If you require any additional information to process this cancellation, please contact me promptly. I expect a confirmation email within 3 business days.

Thank you for your assistance.

Sincerely,
[Your Name]
[Your Email]
[Your Account ID/Email associated with ${name}]`;

  return { subject, body };
}
