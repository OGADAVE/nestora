import { ForgotForm } from '@/components/AuthForms';
export const metadata = { title: 'Reset your password', robots: { index: false } };
export default function Page() {
  return <div className="container-x grid min-h-[60vh] place-items-center py-12"><div className="card w-full max-w-md p-8"><h1 className="font-display text-2xl font-bold">Reset your password</h1><p className="mt-2 text-sm text-neutral-600">We will email you a link to choose a new one.</p><div className="mt-6"><ForgotForm /></div></div></div>;
}
