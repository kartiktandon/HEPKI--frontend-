'use client';

import { FormEvent, useState } from 'react';
import { useSession } from '@/components/SessionProvider';
import AddressManager from '@/components/AddressManager';
import { ErrorNotice, LoginNotice } from '@/components/ApiState';
import { api, errorMessage } from '@/lib/api/client';
import type { InitialResource } from '@/lib/api/hooks';
import { text } from '@/lib/api/models';

export default function AccountPage({ initialAddresses }: { initialAddresses?: InitialResource }) {
  const { user, loading, reload } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api('/api/v1/user/profile', {
        method: 'PUT',
        role: 'user',
        body: Object.fromEntries(new FormData(event.currentTarget)),
      });
      await reload();
      setMessage('Profile updated successfully.');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <section className="section pageTop">
        <div className="container narrow" style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--muted)', fontWeight: 600 }}>Loading account profile…</p>
        </div>
      </section>
    );
  }

  const fullName = text(user?.fullName, 'User');
  const userInitials = fullName
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  return (
    <section className="section pageTop">
      <div className="container narrow">
        <div className="sectionHeading">
          <span className="eyebrow">SETTINGS &amp; PREFERENCES</span>
          <h1>My Account</h1>
          <p>Manage your personal profile details, contact information, and delivery addresses.</p>
        </div>

        {!user ? (
          <LoginNotice next="/account" />
        ) : (
          <div className="stack">
            <div className="formCard">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 700,
                    boxShadow: 'var(--shadow-sm)',
                    flexShrink: 0,
                  }}
                >
                  {userInitials}
                </div>
                <div>
                  <h2 style={{ margin: '0 0 4px', fontSize: '18px' }}>{fullName}</h2>
                  <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--muted)' }}>
                    Mobile: <strong>{text(user.mobileNumber, 'Not provided')}</strong>
                  </p>
                </div>
              </div>

              <form onSubmit={save}>
                <fieldset disabled={busy} style={{ border: 'none', padding: 0, margin: 0 }}>
                  <div className="formGrid">
                    <label>
                      Full name
                      <input name="fullName" required defaultValue={text(user.fullName)} placeholder="Your full name" />
                    </label>
                    <label>
                      Email address
                      <input name="email" type="email" required defaultValue={text(user.email)} placeholder="name@example.com" />
                    </label>
                  </div>

                  <ErrorNotice message={error} />
                  {message && (
                    <div className="authSuccess" style={{ marginTop: '12px' }} role="status">
                      {message}
                    </div>
                  )}

                  <div style={{ marginTop: '20px' }}>
                    <button type="submit" className="primaryButton" disabled={busy}>
                      {busy ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </fieldset>
              </form>
            </div>

            <div style={{ marginTop: '12px' }}>
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '20px', margin: '0 0 4px' }}>Saved Addresses</h2>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>
                  Manage addresses used for instant service dispatch and appointment scheduling.
                </p>
              </div>
              <AddressManager initial={initialAddresses} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

