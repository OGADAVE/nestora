import type { Metadata } from 'next';
import { LoginForm } from '@/components/AuthForms';
export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };
export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next = '/dashboard', error } = await searchParams;
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-12"><div className="card w-full max-w-md p-8">
      <h1 className="font-display text-2xl font-bold">Welcome back</h1>
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">Sign-in did not complete. Please try again.</p>}
      <div className="mt-6"><LoginForm next={next} /></div></div></div>
  );
}
