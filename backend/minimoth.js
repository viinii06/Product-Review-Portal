// Thin wrapper around the Minimoth OTP API (https://minimoth.dev/docs)
const BASE_URL = 'https://api.minimoth.dev/v1';

export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function call(path, body) {
  const apiKey = process.env.MINIMOTH_API_KEY;
  if (!apiKey) throw httpError(500, 'MINIMOTH_API_KEY is not set on the server');

  let res;
  try {
    res = await fetch(BASE_URL + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
      body: JSON.stringify(body),
    });
  } catch {
    throw httpError(502, 'Could not reach the OTP service');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (typeof data.message === 'string' && data.message) ||
      (typeof data.error === 'string' && data.error) ||
      'OTP request failed';
    if (res.status === 401 || res.status === 403) throw httpError(502, 'OTP service rejected the API key');
    if (res.status === 429) throw httpError(429, 'Too many attempts, please wait and try again');
    throw httpError(res.status >= 500 ? 502 : 400, message);
  }
  return data;
}

export const sendOtp = (phone) => call('/otp/send', { phone });
export const verifyOtp = (phone, code) => call('/otp/verify', { phone, code });
