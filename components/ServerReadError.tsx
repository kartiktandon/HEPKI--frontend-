'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
export default function ServerReadError({ message }: { message: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <div className="notice error" role="alert">{message}<button type="button" className="textLink" disabled={pending} onClick={() => startTransition(() => router.refresh())}>{pending ? 'Retrying…' : 'Try again'}</button></div>;
}
