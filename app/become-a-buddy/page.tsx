'use client';
import { FormEvent, useState } from 'react';
import { useCooldown } from '@/lib/hooks/useCooldown';
import { useSession } from '@/components/SessionProvider';
import { ErrorNotice } from '@/components/ApiState';
import { api, errorMessage } from '@/lib/api/client';
import { useResource } from '@/lib/api/hooks';
import { id, list, record, text, unwrap } from '@/lib/api/models';
const stages = ['Personal details', 'Services', 'Location', 'Bank details', 'Documents & submit'];
export default function BecomeBuddyPage() {
  const { provider, reload, loading } = useSession();
  const [mode, setMode] = useState('signup'); const [phone, setPhone] = useState(''); const [countryCode, setCountryCode] = useState('+91'); const [otp, setOtp] = useState(''); const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useCooldown(); const [stage, setStage] = useState(0); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [selected, setSelected] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const catalog = useResource(provider ? '/api/v1/user/services/categories' : null);
  const services = useResource(provider && categoryId ? `/api/v1/user/services/categories/${encodeURIComponent(categoryId)}/services` : null);
  const status = useResource(provider ? '/provider/auth/onboarding/status' : null, 'provider');
  const kyc = useResource(provider ? '/api/v1/provider/kyc/status' : null, 'provider');
  const progress = record(unwrap(status.data)); const verification = record(unwrap(kyc.data));
  async function run(work: () => Promise<void>) { if (busy) return; setBusy(true); setError(''); setMessage(''); try { await work(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); } }
  async function send() { await api(`/provider/auth/${mode}/send-otp`, { method: 'POST', body: { countryCode, mobileNumber: phone } }); setSent(true); setCooldown(60); setMessage('Verification code sent.'); }
  async function login(event: FormEvent) { event.preventDefault(); await run(async () => {
    if (!sent) await send(); else { await api(`/provider/auth/${mode}/verify-otp`, { method: 'POST', body: { countryCode, mobileNumber: phone, otp } }); await reload(); setOtp(''); }
  }); }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const fields = Object.fromEntries(new FormData(form));
    await run(async () => {
      let body: Record<string, unknown> = fields;
      if (stage === 0) body = { ...fields, experienceYears: Number(fields.experienceYears) };
      if (stage === 1) { if (!selected.length) throw new Error('Select at least one service.'); body = { servicesOffered: selected }; }
      if (stage === 2) body = { ...fields, latitude: Number(fields.latitude), longitude: Number(fields.longitude) };
      if (stage === 4) body = {};
      await api(`/provider/auth/onboarding/step-${stage + 1}`, { method: 'POST', role: 'provider', body });
      setMessage(stage === 4 ? 'Your application has been submitted. Check your status below.' : 'Details saved.'); status.reload();
      if (stage < 4) setStage(s => s + 1);
    });
  }
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const values = new FormData(form); const type = String(values.get('documentType')); values.delete('documentType');
    await run(async () => { const file = values.get('file'); if (!file || typeof file === 'string' || !file.size || file.size >= 20 * 1024 * 1024) throw new Error('Choose a file smaller than 20 MB.'); await api(`/api/v1/provider/kyc/upload-${type}`, { method: 'POST', role: 'provider', body: values }); setMessage('Document uploaded.'); form.reset(); kyc.reload(); });
  }
  return <section className="section pageTop"><div className="container narrow"><div className="sectionHeading"><span className="eyebrow">EARN FLEXIBLY</span><h1>Become a Buddy</h1><p>Verify your mobile number and complete your Buddy application.</p></div><ErrorNotice message={error}/>{message && <p role="status" className="notice">{message}</p>}
    {loading ? <p>Checking your account…</p> : !provider ? <form className="formCard" onSubmit={login}><fieldset disabled={busy}><label>Account<select value={mode} disabled={sent} onChange={e => setMode(e.target.value)}><option value="signup">New Buddy — register</option><option value="login">Existing Buddy — log in</option></select></label><div className="formGrid"><label>Country code<input required pattern="\+[0-9]{1,4}" value={countryCode} readOnly={sent} onChange={e => setCountryCode(e.target.value)}/></label><label>Mobile number<input type="tel" required pattern="[0-9]{6,15}" value={phone} readOnly={sent} onChange={e => setPhone(e.target.value)}/></label></div>{sent && <label>OTP<input required autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{4,8}" value={otp} onChange={e => setOtp(e.target.value)}/></label>}<button className="primaryButton" disabled={busy || (!sent && cooldown > 0)}>{busy ? 'Please wait…' : sent ? 'Verify OTP' : 'Send OTP'}</button>{sent && <><button type="button" className="textLink" disabled={cooldown > 0} onClick={() => run(send)}>{cooldown ? `Resend in ${cooldown}s` : 'Resend OTP'}</button><button type="button" className="textLink" onClick={() => setSent(false)}>Change number</button></>}</fieldset></form> : <div className="stack">
    <ErrorNotice message={status.error} retry={status.reload}/><div className="notice">Application status: {text(progress.status ?? progress.onboardingStatus, status.loading ? 'Loading…' : 'Continue the steps below')}<button className="textLink" disabled={busy} onClick={() => run(async () => { await api('/provider/auth/logout', { method: 'POST', body: {} }); await reload(); setSent(false); })}>Log out of Buddy account</button></div>
    <div className="stepper">{stages.map((s, i) => <button type="button" disabled={busy} className={`step ${stage === i ? 'active' : ''}`} key={s} onClick={() => { setStage(i); setMessage(''); }}><span>{i + 1}</span><em>{s}</em></button>)}</div>
    <form className="formCard" onSubmit={save} key={stage}><fieldset disabled={busy}><h2>{stages[stage]}</h2>
    {stage === 0 && <><label>Full name<input name="fullName" required autoComplete="name"/></label><label>Email<input name="email" type="email" required/></label><div className="formGrid"><label>Date of birth<input name="dateOfBirth" type="date" required max={new Date().toISOString().slice(0, 10)}/></label><label>Gender<select name="gender" required><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></label><label>Years of experience<input name="experienceYears" type="number" min="0" max="80" defaultValue="0" required/></label></div><label>About you<textarea name="bio" required/></label></>}
    {stage === 1 && <><ErrorNotice message={catalog.error} retry={catalog.reload}/><label>Category<select value={categoryId} onChange={e => setCategoryId(e.target.value)}><option value="">Choose a category</option>{list(catalog.data).map(c => <option key={id(c)} value={id(c)}>{text(c.categoryName)}</option>)}</select></label><ErrorNotice message={services.error} retry={services.reload}/>{services.loading && <p>Loading services…</p>}{list(services.data, 'services').map(s => <label key={id(s)} className="checkLabel"><input type="checkbox" checked={selected.includes(id(s))} onChange={e => setSelected(e.target.checked ? [...selected, id(s)] : selected.filter(v => v !== id(s)))}/>{text(s.serviceName)}</label>)}<p>{selected.length} service(s) selected across categories.</p></>}
    {stage === 2 && <><label>Base city<input name="baseCity" required/></label><p className="hint">Enter the coordinates of the area where you provide services.</p><div className="formGrid"><label>Latitude<input name="latitude" type="number" step="any" min="-90" max="90" required/></label><label>Longitude<input name="longitude" type="number" step="any" min="-180" max="180" required/></label></div></>}
    {stage === 3 && <><label>Account holder name<input name="accountHolderName" required autoComplete="off"/></label><label>Bank name<input name="bankName" required/></label><label>Account number<input name="accountNumber" inputMode="numeric" required autoComplete="off"/></label><label>IFSC code<input name="ifscCode" required pattern="[A-Za-z]{4}0[A-Za-z0-9]{6}"/></label><label>UPI ID (optional)<input name="upiId" autoComplete="off"/></label></>}
    {stage === 4 && <><p>Upload the required identity documents below, then submit your completed application for review.</p><p>Verification status: {text(verification.status ?? verification.kycStatus, 'Check documents below')}</p><ErrorNotice message={kyc.error} retry={kyc.reload}/></>}
    <button className="primaryButton">{busy ? 'Saving…' : stage === 4 ? 'Submit application for review' : 'Save & continue'}</button></fieldset></form>
    {stage === 4 && <form className="formCard" onSubmit={upload}><fieldset disabled={busy}><h3>Upload an identity document</h3><label>Document<select name="documentType"><option value="aadhaar-front">Aadhaar front</option><option value="aadhaar-back">Aadhaar back</option><option value="pan">PAN card</option><option value="selfie">Selfie</option></select></label><label>File (under 20 MB)<input type="file" name="file" accept="image/*,application/pdf" required/></label><button className="secondaryButton">Upload document</button></fieldset></form>}
    </div>}
  </div></section>;
}
