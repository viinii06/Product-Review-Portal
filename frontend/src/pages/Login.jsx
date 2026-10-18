import { useState } from 'react';
import { api } from '../api.js';

const PHONE_RE = /^\+[1-9]\d{9,14}$/;

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [step, setStep] = useState('phone'); // 'phone' | 'code'
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';

  function switchMode(next) {
    setMode(next);
    setStep('phone');
    setError('');
    setInfo('');
    setCode('');
  }

  async function sendCode(e) {
    e.preventDefault();
    setError('');
    if (isRegister && name.trim().length < 2) return setError('Please enter your name (min 2 characters)');
    if (!PHONE_RE.test(phone.trim())) return setError('Use international format, e.g. +919876543210');

    setBusy(true);
    try {
      await api('/auth/send-otp', {
        method: 'POST',
        body: { phone: phone.trim(), ...(isRegister && { name }) },
      });
      setStep('code');
      setInfo(`We sent a 6-digit code to ${phone.trim()} via WhatsApp/SMS.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e) {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code');

    setBusy(true);
    try {
      const { token, user } = await api('/auth/verify-otp', {
        method: 'POST',
        body: { phone: phone.trim(), code, ...(isRegister && { name }) },
      });
      onLogin(token, user);
      window.location.hash = '/';
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel auth">
      <div className="tabs">
        <button className={!isRegister ? 'active' : ''} onClick={() => switchMode('login')}>
          Log in
        </button>
        <button className={isRegister ? 'active' : ''} onClick={() => switchMode('register')}>
          Register
        </button>
      </div>

      {step === 'phone' ? (
        <form onSubmit={sendCode}>
          {isRegister && (
            <label>
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Asha Patel" maxLength="50" />
            </label>
          )}
          <label>
            Phone number
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919876543210"
            />
          </label>
          {error && <p className="alert">{error}</p>}
          <button className="btn" disabled={busy}>
            {busy ? 'Sending…' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={verify}>
          {info && <p className="note">{info}</p>}
          <label>
            OTP code
            <input
              inputMode="numeric"
              maxLength="6"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="otp"
              autoFocus
            />
          </label>
          {error && <p className="alert">{error}</p>}
          <button className="btn" disabled={busy}>
            {busy ? 'Verifying…' : isRegister ? 'Create account' : 'Log in'}
          </button>
          <button type="button" className="link-btn" onClick={() => setStep('phone')}>
            ← Change number
          </button>
        </form>
      )}
    </section>
  );
}
