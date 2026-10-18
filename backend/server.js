import crypto from 'node:crypto';
import express from 'express';
import db from './db.js';
import { sendOtp, verifyOtp, httpError } from './minimoth.js';

const app = express();
app.use(express.json());

const PHONE_RE = /^\+[1-9]\d{9,14}$/; // E.164, e.g. +919876543210
const CODE_RE = /^\d{6}$/;

const findUserByPhone = (phone) => db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);

function validatePhone(phone) {
  if (typeof phone !== 'string' || !PHONE_RE.test(phone.trim())) {
    throw httpError(400, 'Enter phone in international format, e.g. +919876543210');
  }
  return phone.trim();
}

function validateName(name) {
  if (name === undefined || name === null || name === '') return null; // login (no name)
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50) {
    throw httpError(400, 'Name must be 2-50 characters');
  }
  return name.trim();
}

function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  const user = token && db.prepare('SELECT id, name, phone FROM users WHERE token = ?').get(token);
  if (!user) return res.status(401).json({ error: 'Please log in to continue' });
  req.user = user;
  next();
}

// 1. Send OTP (register when a name is given, otherwise login)
app.post('/api/auth/send-otp', async (req, res) => {
  const phone = validatePhone(req.body?.phone);
  const name = validateName(req.body?.name);
  const existing = findUserByPhone(phone);

  if (name && existing) throw httpError(409, 'This phone is already registered, please log in');
  if (!name && !existing) throw httpError(404, 'No account found for this phone, please register');

  await sendOtp(phone);
  res.json({ message: 'OTP sent' });
});

// 2. Verify OTP -> create user if registering, return a session token
app.post('/api/auth/verify-otp', async (req, res) => {
  const phone = validatePhone(req.body?.phone);
  const name = validateName(req.body?.name);
  const code = String(req.body?.code ?? '').trim();
  if (!CODE_RE.test(code)) throw httpError(400, 'OTP must be 6 digits');

  await verifyOtp(phone, code);

  let user = findUserByPhone(phone);
  if (!user) {
    if (!name) throw httpError(404, 'No account found for this phone, please register');
    db.prepare('INSERT INTO users (name, phone) VALUES (?, ?)').run(name, phone);
    user = findUserByPhone(phone);
  }

  const token = crypto.randomUUID();
  db.prepare('UPDATE users SET token = ? WHERE id = ?').run(token, user.id);
  res.json({ token, user: { id: user.id, name: user.name, phone: user.phone } });
});

// 3. List products with rating summary
app.get('/api/products', (req, res) => {
  const products = db
    .prepare(
      `SELECT p.*, ROUND(AVG(r.rating), 1) AS avg_rating, COUNT(r.id) AS review_count
       FROM products p LEFT JOIN reviews r ON r.product_id = p.id
       GROUP BY p.id ORDER BY p.id`
    )
    .all();
  res.json(products);
});

function getProduct(idParam) {
  const id = Number(idParam);
  const product = Number.isInteger(id) && db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!product) throw httpError(404, 'Product not found');
  return product;
}

// 4. Product details with its reviews
app.get('/api/products/:id', (req, res) => {
  const product = getProduct(req.params.id);
  const reviews = db
    .prepare(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS user_name, r.user_id
       FROM reviews r JOIN users u ON u.id = r.user_id
       WHERE r.product_id = ? ORDER BY r.id DESC`
    )
    .all(product.id);
  res.json({ ...product, reviews });
});

// 5. Add a review (logged-in users, one per product)
app.post('/api/products/:id/reviews', requireAuth, (req, res) => {
  const product = getProduct(req.params.id);
  const rating = Number(req.body?.rating);
  const comment = typeof req.body?.comment === 'string' ? req.body.comment.trim() : '';

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw httpError(400, 'Rating must be 1 to 5');
  if (comment.length < 3 || comment.length > 500) throw httpError(400, 'Comment must be 3-500 characters');

  const already = db
    .prepare('SELECT id FROM reviews WHERE product_id = ? AND user_id = ?')
    .get(product.id, req.user.id);
  if (already) throw httpError(409, 'You have already reviewed this product');

  const { lastInsertRowid } = db
    .prepare('INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)')
    .run(product.id, req.user.id, rating, comment);
  res.status(201).json({ id: Number(lastInsertRowid), rating, comment, user_name: req.user.name });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Central error handler: known errors keep their message, others are hidden
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status === 500 && !err.status ? 'Something went wrong' : err.message });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
