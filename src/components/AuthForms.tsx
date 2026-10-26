'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { forgotPassword, resetPassword, signIn, signUp, type ActionResult } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';

const Msg = ({ s }: { s: ActionResult | null }) => s ? <p role={s.ok ? 'status' : 'alert'} className={`rounded-lg p-3 text-sm ${s.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>{s.ok ? s.message : s.error}</p> : null;

function Google({ next }: { next: string }) {
  return (
    <button type="button" className="btn-outline w-full" onClick={() => createClient().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` } })}>
      Continue with Google
    </button>
  );
}
const Or = () => <p className="my-1 text-center text-xs text-neutral-400">or use your email</p>;

export function LoginForm({ next }: { next: string }) {
  const [s, action, pending] = useActionState<ActionResult | null, FormData>(signIn, null);
  return (
    <div className="grid gap-4"><Google next={next} /><Or />
      <form action={action} className="grid gap-4"><input type="hidden" name="next" value={next} />
        <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required className="field" /></div>
        <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required className="field" /></div>
        <Msg s={s} /><button disabled={pending} className="btn-primary">{pending ? 'Signing in...' : 'Sign in'}</button>
      </form>
      <p className="text-center text-sm text-neutral-600"><Link href="/forgot-password" className="underline">Forgot password?</Link> · <Link href="/signup" className="underline">Create an account</Link></p>
    </div>
  );
}

export function SignupForm() {
  const [s, action, pending] = useActionState<ActionResult | null, FormData>(signUp, null);
  return (
    <div className="grid gap-4"><Google next="/dashboard" /><Or />
      <form action={action} className="grid gap-4">
        <div><label className="label" htmlFor="name">Full name</label><input id="name" name="name" autoComplete="name" required className="field" /></div>
        <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required className="field" /></div>
        <div><label className="label" htmlFor="password">Password (8+ characters)</label><input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required className="field" /></div>
        <div><label className="label" htmlFor="role">I am a</label>
          <select id="role" name="role" className="field" defaultValue="seeker">
            <option value="seeker">Property seeker</option><option value="vehicle_seeker">Vehicle seeker</option><option value="landlord">Landlord or owner</option>
            <option value="agent">Agent</option><option value="agency">Agency</option><option value="investor">Investor</option>
          </select></div>
        <Msg s={s} /><button disabled={pending} className="btn-primary">{pending ? 'Creating account...' : 'Create account'}</button>
      </form>
      <p className="text-center text-sm text-neutral-600">Already have an account? <Link href="/login" className="underline">Sign in</Link></p>
    </div>
  );
}

export function ForgotForm() {
  const [s, action, pending] = useActionState<ActionResult | null, FormData>(forgotPassword, null);
  return (
    <form action={action} className="grid gap-4">
      <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required className="field" /></div>
      <Msg s={s} /><button disabled={pending} className="btn-primary">{pending ? 'Sending...' : 'Send reset link'}</button>
    </form>
  );
}

export function ResetForm() {
  const [s, action, pending] = useActionState<ActionResult | null, FormData>(resetPassword, null);
  return (
    <form action={action} className="grid gap-4">
      <div><label className="label" htmlFor="password">New password</label><input id="password" name="password" type="password" minLength={8} required className="field" /></div>
      <Msg s={s} /><button disabled={pending} className="btn-primary">{pending ? 'Saving...' : 'Update password'}</button>
    </form>
  );
}
