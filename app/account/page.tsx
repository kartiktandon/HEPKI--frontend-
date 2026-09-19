'use client';
import { FormEvent, useState } from 'react';
import { useSession } from '@/components/SessionProvider';
import AddressManager from '@/components/AddressManager';
import { ErrorNotice, LoginNotice } from '@/components/ApiState';
import { api, errorMessage } from '@/lib/api/client';
import { text } from '@/lib/api/models';
export default function AccountPage() {
  const { user, loading, reload } = useSession(); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try { await api('/api/v1/user/profile', { method: 'PUT', role: 'user', body: Object.fromEntries(new FormData(event.currentTarget)) }); await reload(); setMessage('Profile saved.'); }
    catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <section className="section pageTop"><div className="container narrow"><h1>Your account</h1>{loading ? <p>Checking your account…</p> : !user ? <LoginNotice next="/account"/> : <div className="stack"><form className="formCard" onSubmit={save}><h2>Profile</h2><label>Full name<input name="fullName" required defaultValue={text(user.fullName)}/></label><label>Email<input name="email" type="email" required defaultValue={text(user.email)}/></label><p>Mobile: {text(user.mobileNumber, 'Not provided')}</p><ErrorNotice message={error}/>{message && <p role="status">{message}</p>}<button className="primaryButton" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button></form><h2>Service addresses</h2><AddressManager/></div>}</div></section>;
}
