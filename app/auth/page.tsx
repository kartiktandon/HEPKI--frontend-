'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, errorMessage } from '@/lib/api/client';
import { useCooldown } from '@/lib/hooks/useCooldown';
import { useSession } from '@/components/SessionProvider';
import { ErrorNotice } from '@/components/ApiState';

type Mode = 'login' | 'register' | 'verify' | 'forgot' | 'reset';

function MailIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

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

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [method, setMethod] = useState<'email' | 'mobile'>('email');
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    setPassword('');
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
    const path = method === 'mobile'
      ? `/auth/user/${mode === 'register' ? 'signup' : 'login'}/send-otp`
      : '/auth/user/email/resend-verification';
    await api(path, { method: 'POST', body: method === 'mobile' ? { countryCode, mobileNumber: phone } : { email } });
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
      if (method === 'mobile') {
        if (!otpSent) {
          await sendOtp();
        } else {
          await api(`/auth/user/${mode === 'register' ? 'signup' : 'login'}/verify-otp`, {
            method: 'POST',
            body: { countryCode, mobileNumber: phone, otp },
          });
          await signedIn();
        }
      } else if (mode === 'login') {
        await api('/auth/user/email/login', { method: 'POST', body: { email, password } });
        await signedIn();
      } else if (mode === 'register') {
        await api('/auth/user/email/signup', {
          method: 'POST',
          body: { fullName: name, email, password, mobileNumber: phone, countryCode },
        });
        setPassword('');
        setMode('verify');
        setCooldown(60);
        setMessage('Account created! Please check your email for your verification code.');
      } else if (mode === 'verify') {
        await api('/auth/user/email/verify-otp', { method: 'POST', body: { email, otp } });
        await reload();
        change('login');
        setMessage('Email verified successfully! You can now log in.');
      } else if (mode === 'forgot') {
        await api('/auth/user/email/forgot-password', { method: 'POST', body: { email } });
        setMode('reset');
        setCooldown(60);
        setMessage('If an account matches this email, a password reset code has been sent.');
      } else {
        await api('/auth/user/email/reset-password', { method: 'POST', body: { email, otp, newPassword: password } });
        change('login');
        setMessage('Your password has been reset successfully. Please log in with your new password.');
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const isMainMode = mode === 'login' || mode === 'register';

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
              {mode === 'login'
                ? 'Welcome Back'
                : mode === 'register'
                ? 'Create Your Account'
                : mode === 'verify'
                ? 'Verify Your Email'
                : mode === 'forgot'
                ? 'Reset Password'
                : 'Set New Password'}
            </h2>
            <p>
              {mode === 'login'
                ? 'Sign in to access your bookings and account settings.'
                : mode === 'register'
                ? 'Join Hepki in less than a minute to start booking Buddies.'
                : mode === 'verify'
                ? `Enter the 6-digit code sent to ${email || 'your email'}.`
                : mode === 'forgot'
                ? 'Enter your registered email to receive a password reset code.'
                : 'Enter the verification code and your new password.'}
            </p>
          </div>

          <form onSubmit={submit}>
            <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Login / Register Segmented Switch */}
              {isMainMode && (
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
              )}

              {/* Method Selector: Email vs Mobile */}
              {isMainMode && (
                <div className="methodSwitch">
                  <button
                    type="button"
                    className={`methodBtn ${method === 'email' ? 'active' : ''}`}
                    onClick={() => {
                      setMethod('email');
                      change(mode);
                    }}
                  >
                    <MailIcon /> Email & Password
                  </button>
                  <button
                    type="button"
                    className={`methodBtn ${method === 'mobile' ? 'active' : ''}`}
                    onClick={() => {
                      setMethod('mobile');
                      change(mode);
                    }}
                  >
                    <PhoneIcon /> Mobile Phone (OTP)
                  </button>
                </div>
              )}

              {/* Back to Login for Forgot/Verify/Reset */}
              {!isMainMode && (
                <button
                  type="button"
                  className="textLink"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700 }}
                  onClick={() => change('login')}
                >
                  ← Back to Sign In
                </button>
              )}

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

              {/* Email Input */}
              {(method === 'email' || !isMainMode) && (
                <label className="formLabel">
                  Email address
                  <div className="inputWrapper">
                    <span className="inputIcon"><MailIcon /></span>
                    <input
                      className="authInput"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value.trim())}
                      readOnly={mode === 'reset'}
                    />
                  </div>
                </label>
              )}

              {/* Mobile Phone Input */}
              {(method === 'mobile' || (mode === 'register' && method === 'email')) && (
                <label className="formLabel">
                  Mobile number {mode === 'register' && method === 'email' ? '(optional)' : ''}
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
                        required={method === 'mobile'}
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
              )}

              {/* Password Input */}
              {method === 'email' && ['login', 'register', 'reset'].includes(mode) && (
                <label className="formLabel">
                  {mode === 'reset' ? 'New password' : 'Password'}
                  <div className="inputWrapper">
                    <span className="inputIcon"><LockIcon /></span>
                    <input
                      className="authInput withTrailing"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      required
                      minLength={mode === 'login' ? undefined : 8}
                      placeholder={mode === 'register' ? 'Minimum 8 characters' : 'Enter your password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="trailingBtn"
                      onClick={() => setShowPassword(v => !v)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      <EyeIcon visible={showPassword} />
                    </button>
                  </div>
                </label>
              )}

              {/* Forgot Password Link */}
              {method === 'email' && mode === 'login' && (
                <div className="authHelperRow">
                  <button
                    type="button"
                    className="textLink"
                    style={{ fontSize: '13px', fontWeight: 650 }}
                    onClick={() => change('forgot')}
                  >
                    Forgot password?
                  </button>
                  <button
                    type="button"
                    className="textLink"
                    style={{ fontSize: '13px', color: 'var(--muted)' }}
                    onClick={() => change('verify')}
                  >
                    Need email verification?
                  </button>
                </div>
              )}

              {/* OTP Verification Code */}
              {(otpSent || mode === 'verify' || mode === 'reset') && (
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
                disabled={busy || (method === 'mobile' && !otpSent && cooldown > 0) || (mode === 'forgot' && cooldown > 0)}
              >
                {busy ? (
                  'Please wait…'
                ) : method === 'mobile' ? (
                  otpSent ? 'Verify OTP & Sign In' : 'Send One-Time Password'
                ) : (
                  {
                    login: 'Sign In to Hepki',
                    register: 'Create Account & Continue',
                    verify: 'Verify Email & Continue',
                    forgot: 'Send Password Reset Code',
                    reset: 'Save New Password & Log In',
                  }[mode]
                )}
              </button>

              {/* Resend and Edit Actions */}
              {(otpSent || mode === 'verify') && (
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

                  {otpSent && (
                    <button type="button" className="textLink" style={{ color: 'var(--muted)' }} onClick={() => setOtpSent(false)}>
                      Change number
                    </button>
                  )}
                </div>
              )}

              {mode === 'reset' && (
                <button
                  type="button"
                  className="textLink"
                  style={{ fontSize: '13px', alignSelf: 'center' }}
                  disabled={busy || cooldown > 0}
                  onClick={() => setMode('forgot')}
                >
                  {cooldown ? `Request a new code in ${cooldown}s` : 'Request a new code'}
                </button>
              )}

              {/* Bottom Mode Switch Footer */}
              {isMainMode && (
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
              )}
            </fieldset>
          </form>
        </div>
      </div>
    </section>
  );
}
