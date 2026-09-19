'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, errorMessage } from '@/lib/api/client';
import { useCooldown } from '@/lib/hooks/useCooldown';
import { useSession } from '@/components/SessionProvider';
import { ErrorNotice } from '@/components/ApiState';

type Mode = 'login' | 'register' | 'verify' | 'forgot' | 'reset';
export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [method, setMethod] = useState<'email' | 'mobile'>('email');
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [name, setName] = useState(''); const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91'); const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false); const [cooldown, setCooldown] = useCooldown();
  const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const { reload } = useSession(); const router = useRouter();
  function change(next: Mode) { setMode(next); setOtpSent(false); setOtp(''); setPassword(''); setError(''); setMessage(''); }
  async function signedIn() {
    await reload();
    const session = await fetch('/api/session', { cache: 'no-store' }).then(response => response.json());
    if (!session.user) throw new Error('Your session could not be established. Please log in again.');
    const next = new URLSearchParams(window.location.search).get('next') || '/bookings';
    router.replace(next.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : '/bookings');
  }
  async function sendOtp() {
    const path = method === 'mobile' ? `/auth/user/${mode === 'register' ? 'signup' : 'login'}/send-otp` : '/auth/user/email/resend-verification';
    await api(path, { method: 'POST', body: method === 'mobile' ? { countryCode, mobileNumber: phone } : { email } });
    setCooldown(60); setOtpSent(true); setMessage('A verification code has been sent.');
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return; setBusy(true); setError(''); setMessage('');
    try {
      if (method === 'mobile') {
        if (!otpSent) await sendOtp();
        else { await api(`/auth/user/${mode === 'register' ? 'signup' : 'login'}/verify-otp`, { method: 'POST', body: { countryCode, mobileNumber: phone, otp } }); await signedIn(); }
      } else if (mode === 'login') { await api('/auth/user/email/login', { method: 'POST', body: { email, password } }); await signedIn(); }
      else if (mode === 'register') {
        await api('/auth/user/email/signup', { method: 'POST', body: { fullName: name, email, password, mobileNumber: phone, countryCode } });
        setPassword(''); setMode('verify'); setCooldown(60); setMessage('Check your email for your verification code.');
      } else if (mode === 'verify') {
        await api('/auth/user/email/verify-otp', { method: 'POST', body: { email, otp } });
        await reload(); change('login'); setMessage('Email verified. You can now log in.');
      } else if (mode === 'forgot') {
        await api('/auth/user/email/forgot-password', { method: 'POST', body: { email } });
        setMode('reset'); setCooldown(60); setMessage('If this account exists, a reset code has been sent.');
      } else {
        await api('/auth/user/email/reset-password', { method: 'POST', body: { email, otp, newPassword: password } });
        change('login'); setMessage('Password reset. Log in with your new password.');
      }
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  }
  const title = { login: 'Login to continue', register: 'Create your account', verify: 'Verify your email', forgot: 'Reset your password', reset: 'Choose a new password' }[mode];
  return <section className="section pageTop"><div className="container authWrap"><div className="authAside"><span className="eyebrow">YOUR HEPKI ACCOUNT</span><h1>{title}</h1><p>Sign in to book services and manage your bookings.</p></div><form className="formCard" onSubmit={submit}>
    <fieldset disabled={busy}><div className="tabRow"><button type="button" onClick={() => change('login')} className={mode === 'login' ? 'active' : ''}>Login</button><button type="button" onClick={() => change('register')} className={mode === 'register' ? 'active' : ''}>Register</button></div>
    {['login', 'register'].includes(mode) && <label>Sign in with<select value={method} onChange={e => { setMethod(e.target.value as 'email' | 'mobile'); change(mode); }}><option value="email">Email & password</option><option value="mobile">Mobile OTP</option></select></label>}
    {method === 'email' && <label>Email<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value.trim())} readOnly={mode === 'reset'}/></label>}
    {method === 'email' && mode === 'register' && <label>Full name<input required autoComplete="name" value={name} onChange={e => setName(e.target.value)}/></label>}
    {(method === 'mobile' || mode === 'register') && <div className="formGrid"><label>Country code<input required pattern="\+[0-9]{1,4}" value={countryCode} onChange={e => setCountryCode(e.target.value)} readOnly={otpSent}/></label><label>Mobile number<input type="tel" required pattern="[0-9]{6,15}" autoComplete="tel-national" value={phone} onChange={e => setPhone(e.target.value)} readOnly={otpSent}/></label></div>}
    {method === 'email' && ['login', 'register', 'reset'].includes(mode) && <label>{mode === 'reset' ? 'New password' : 'Password'}<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'login' ? undefined : 8} value={password} onChange={e => setPassword(e.target.value)}/></label>}
    {(otpSent || mode === 'verify' || mode === 'reset') && <label>Verification code<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{4,8}" value={otp} onChange={e => setOtp(e.target.value)}/></label>}
    <ErrorNotice message={error}/>{message && <p className="notice" role="status">{message}</p>}
    <button className="primaryButton full" disabled={busy || (method === 'mobile' && !otpSent && cooldown > 0) || (mode === 'forgot' && cooldown > 0)}>{busy ? 'Please wait…' : method === 'mobile' ? otpSent ? 'Verify & continue' : 'Send OTP' : { login: 'Login', register: 'Create account', verify: 'Verify email', forgot: 'Send reset code', reset: 'Save new password' }[mode]}</button>
    {method === 'email' && mode === 'login' && <><button type="button" className="textLink" onClick={() => change('forgot')}>Forgot password?</button><button type="button" className="textLink" onClick={() => change('verify')}>Verify an existing account</button></>}
    {(otpSent || mode === 'verify') && <button type="button" className="textLink" disabled={busy || cooldown > 0} onClick={async () => { setBusy(true); setError(''); try { await sendOtp(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); } }}>{cooldown ? `Resend in ${cooldown}s` : 'Resend code'}</button>}
    {mode === 'reset' && <button type="button" className="textLink" disabled={busy || cooldown > 0} onClick={() => setMode('forgot')}>{cooldown ? `Request a new code in ${cooldown}s` : 'Request a new code'}</button>}
    {otpSent && <button type="button" className="textLink" onClick={() => setOtpSent(false)}>Change phone number</button>}
    </fieldset></form></div></section>;
}
