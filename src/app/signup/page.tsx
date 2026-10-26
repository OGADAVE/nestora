import type { Metadata } from 'next';
import { SignupForm } from '@/components/AuthForms';
export const metadata: Metadata = { title: 'Create your account', robots: { index: false } };
export default function Signup() {
  return <div className="container-x grid min-h-[70vh] place-items-center py-12"><div className="card w-full max-w-md p-8"><h1 className="font-display text-2xl font-bold">Create your Nestora account</h1><div className="mt-6"><SignupForm /></div></div></div>;
}
