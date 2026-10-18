# ★ Product Review Portal

A small full-stack app for browsing products and posting star-rated reviews. Users register and log in with a phone OTP sent through [Minimoth](https://minimoth.dev) (WhatsApp first, falling back to SMS).

- **Frontend:** React + Vite (3 pages: Products, Product detail, Login/Register)
- **Backend:** Node.js + Express, with SQLite from Node's built-in `node:sqlite`
- **Data:** 3 tables: `users`, `products`, `reviews`

## API

| Method | Endpoint                    | Description                                   |
| ------ | --------------------------- | --------------------------------------------- |
| POST   | `/api/auth/send-otp`        | `{ phone, name? }` sends an OTP (a name means register) |
| POST   | `/api/auth/verify-otp`      | `{ phone, code, name? }` returns `{ token, user }`       |
| GET    | `/api/products`             | Products with average rating and review count |
| GET    | `/api/products/:id`         | One product and its reviews                   |
| POST   | `/api/products/:id/reviews` | `{ rating, comment }` (needs `Authorization: Bearer <token>`) |

## Prerequisites

- Node.js **22.13+** (built-in SQLite and `--env-file`)
- A Minimoth API key from your Minimoth dashboard. An `mm_test_` sandbox key sends no real OTPs.

## Setup & run

**1. Backend** (http://localhost:4000)

```bash
cd backend
cp .env.example .env      # then put your MINIMOTH_API_KEY in .env
npm install
npm start
```

**2. Frontend** (http://localhost:5173), in a second terminal

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173. Click **Log in**, then **Register**, and enter your name and a phone number in international format (for example `+919876543210`). Enter the 6-digit code you receive, and you can then review products.

## Notes

- Six sample products are seeded into `backend/reviews.db` on first run. Delete the file to reset the data.
- The Vite dev server proxies `/api` to `VITE_API_URL`, so the browser uses a single origin and no CORS setup is needed.
- Each user can post one review per product.
