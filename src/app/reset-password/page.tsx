import { ResetForm } from '@/components/AuthForms';
export const metadata = { title: 'Choose a new password', robots: { index: false } };
export default function Page() {
  return <div className="container-x grid min-h-[60vh] place-items-center py-12"><div className="card w-full max-w-md p-8"><h1 className="font-display text-2xl font-bold">Choose a new password</h1><div className="mt-6"><ResetForm /></div></div></div>;
}
