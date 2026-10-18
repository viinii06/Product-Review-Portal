import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Stars from '../Stars.jsx';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/products')
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="hero">
        <h1>Honest reviews, no fluff.</h1>
        <p>Pick a product, read what people think, and add your own take.</p>
      </section>

      {loading && <p className="muted">Loading products…</p>}
      {error && <p className="alert">{error}</p>}

      <div className="grid">
        {products.map((p, i) => (
          <a key={p.id} href={`#/products/${p.id}`} className={`card tint-${i % 3}`}>
            <div className="emoji">{p.emoji}</div>
            <h2>{p.name}</h2>
            <p>{p.description}</p>
            <div className="meta">
              <Stars value={p.avg_rating} />
              <span>
                {p.avg_rating ?? '–'} · {p.review_count} review{p.review_count === 1 ? '' : 's'}
              </span>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}
