import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync(process.env.DB_FILE || 'reviews.db');

// Three entities: users, products, reviews
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    phone      TEXT NOT NULL UNIQUE,
    token      TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT NOT NULL,
    emoji       TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id),
    user_id    INTEGER NOT NULL REFERENCES users(id),
    rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment    TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (product_id, user_id)
  );
`);

// Seed a few products on first run
const { count } = db.prepare('SELECT COUNT(*) AS count FROM products').get();
if (count === 0) {
  const insert = db.prepare('INSERT INTO products (name, description, emoji) VALUES (?, ?, ?)');
  [
    ['Echo Buds', 'Wireless earbuds with 24-hour battery life.', '🎧'],
    ['Brew Master', 'Programmable drip coffee maker, 12 cups.', '☕'],
    ['Trail Pack 30L', 'Lightweight water-resistant hiking backpack.', '🎒'],
    ['Glow Lamp', 'Dimmable LED desk lamp with USB charging.', '💡'],
    ['Swift Runner', 'Breathable running shoes for daily training.', '👟'],
    ['Pixel Watch', 'Smartwatch with heart-rate and sleep tracking.', '⌚'],
  ].forEach((p) => insert.run(...p));
}

export default db;
