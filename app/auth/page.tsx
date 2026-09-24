'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, errorMessage } from '@/lib/api/client';
import { useCooldown } from '@/lib/hooks/useCooldown';
import { useSession } from '@/components/SessionProvider';
import { ErrorNotice } from '@/components/ApiState';

type Mode = 'login' | 'register';

function UserIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [otpSent, setOtpSent] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useCooldown();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const { reload } = useSession();
  const router = useRouter();

  function change(next: Mode) {
    setMode(next);
    setOtpSent(false);
    setOtp('');
    setError('');
    setMessage('');
  }

  async function signedIn() {
    await reload();
    const session = await fetch('/api/session', { cache: 'no-store' }).then(response => response.json());
    if (!session.user) throw new Error('Your session could not be established. Please log in again.');
    const next = new URLSearchParams(window.location.search).get('next') || '/bookings';
    router.replace(next.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : '/bookings');
  }

  async function sendOtp() {
    await api(`/auth/user/${mode === 'register' ? 'signup' : 'login'}/send-otp`, {
      method: 'POST',
      body: { countryCode, mobileNumber: phone },
    });
    setCooldown(60);
    setOtpSent(true);
    setMessage('A 6-digit verification code has been sent.');
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (!otpSent) {
        await sendOtp();
      } else {
        await api(`/auth/user/${mode === 'register' ? 'signup' : 'login'}/verify-otp`, {
          method: 'POST',
          body: { countryCode, mobileNumber: phone, otp },
        });
        await signedIn();
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section pageTop" style={{ minHeight: '82vh', paddingBottom: '72px' }}>
      <div className="container authModernWrap">
        {/* Left Aside: Brand & Value Showcase */}
        <div className="authBrandShowcase">
          <span className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span>⚡</span> FAST & SECURE ACCESS
          </span>
          <h1>Your trusted companion for everyday help.</h1>
          <p>
            Sign in to book verified Buddies for on-demand errands, hospital accompaniment, house chores, moves, and everyday tasks.
          </p>

          <div className="authFeatureList">
            <div className="authFeatureItem">
              <div className="authFeatureIcon">⚡</div>
              <div className="authFeatureText">
                <strong>Instant Buddy Dispatch</strong>
                <span>Get matched with top-rated nearby buddies in under 15 minutes.</span>
              </div>
            </div>

            <div className="authFeatureItem">
              <div className="authFeatureIcon">🛡️</div>
              <div className="authFeatureText">
                <strong>100% Secure Payments</strong>
                <span>Encrypted checkout and safe transactions powered by Razorpay.</span>
              </div>
            </div>

            <div className="authFeatureItem">
              <div className="authFeatureIcon">📍</div>
              <div className="authFeatureText">
                <strong>Live Status & Direct Chat</strong>
                <span>Coordinate directly with your assigned Buddy from booking to completion.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Aside: Elevated Auth Card */}
        <div className="authCard">
          <div className="authCardHeader">
            <h2>
              {mode === 'login' ? 'Welcome Back' : 'Create Your Account'}
            </h2>
            <p>
              {mode === 'login'
                ? 'Sign in securely with the one-time password sent to your phone.'
                : 'Create your account securely with your name and phone number.'}
            </p>
          </div>

          <form onSubmit={submit}>
            <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Login / Register Segmented Switch */}
              <div className="authModeSwitch">
                <button
                  type="button"
                  onClick={() => change('login')}
                  className={`authModeBtn ${mode === 'login' ? 'active' : ''}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => change('register')}
                  className={`authModeBtn ${mode === 'register' ? 'active' : ''}`}
                >
                  Create Account
                </button>
              </div>

              {/* Full Name (Register Only) */}
              {mode === 'register' && (
                <label className="formLabel">
                  Full name
                  <div className="inputWrapper">
                    <span className="inputIcon"><UserIcon /></span>
                    <input
                      className="authInput"
                      required
                      autoComplete="name"
                      placeholder="e.g. Kartik Tandon"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                </label>
              )}

              {/* Mobile Phone Input */}
              <label className="formLabel">
                Mobile number
                <div className="phoneInputGrid">
                  <input
                    className="authInput countryCodeField"
                    required
                    pattern="\+[0-9]{1,4}"
                    value={countryCode}
                    onChange={e => setCountryCode(e.target.value)}
                    readOnly={otpSent}
                  />
                  <div className="inputWrapper">
                    <span className="inputIcon"><PhoneIcon /></span>
                    <input
                      className="authInput"
                      type="tel"
                      required
                      pattern="[0-9]{6,15}"
                      autoComplete="tel-national"
                      placeholder="10-digit number"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      readOnly={otpSent}
                    />
                  </div>
                </div>
              </label>

              {/* OTP Verification Code */}
              {otpSent && (
                <label className="formLabel">
                  6-digit verification code
                  <div className="inputWrapper">
                    <span className="inputIcon"><KeyIcon /></span>
                    <input
                      className="authInput"
                      required
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{4,8}"
                      placeholder="e.g. 123456"
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      style={{ letterSpacing: '0.15em', fontWeight: 700 }}
                    />
                  </div>
                </label>
              )}

              {/* Error and Status Notices */}
              <ErrorNotice message={error} />
              {message && (
                <div
                  className="notice"
                  role="status"
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#166534',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    fontSize: '13.5px',
                    margin: '0',
                  }}
                >
                  {message}
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                className="primaryButton full checkoutBtn"
                disabled={busy || (!otpSent && cooldown > 0)}
              >
                {busy ? (
                  'Please wait…'
                ) : (
                  otpSent
                    ? mode === 'register' ? 'Verify OTP & Create Account' : 'Verify OTP & Sign In'
                    : 'Send One-Time Password'
                )}
              </button>

              {/* Resend and Edit Actions */}
              {otpSent && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', marginTop: '-4px' }}>
                  <button
                    type="button"
                    className="textLink"
                    disabled={busy || cooldown > 0}
                    onClick={async () => {
                      setBusy(true);
                      setError('');
                      try {
                        await sendOtp();
                      } catch (e) {
                        setError(errorMessage(e));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {cooldown ? `Resend code in ${cooldown}s` : 'Resend verification code'}
                  </button>

                  <button type="button" className="textLink" style={{ color: 'var(--muted)' }} onClick={() => setOtpSent(false)}>
                    Change number
                  </button>
                </div>
              )}

              {/* Bottom Mode Switch Footer */}
              <div className="authFooter">
                {mode === 'login' ? (
                  <>
                    Don’t have an account yet?{' '}
                    <button type="button" onClick={() => change('register')}>
                      Create account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button type="button" onClick={() => change('login')}>
                      Sign in
                    </button>
                  </>
                )}
              </div>
            </fieldset>
          </form>
        </div>
      </div>
    </section>
  );
}
