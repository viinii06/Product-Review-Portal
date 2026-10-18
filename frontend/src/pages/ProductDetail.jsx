import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Stars from '../Stars.jsx';

export default function ProductDetail({ id, user, onLogout }) {
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () =>
    api(`/products/${id}`)
      .then(setProduct)
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, [id]);

  async function submit(e) {
    e.preventDefault();
    setFormError('');
    if (rating < 1) return setFormError('Please pick a star rating');
    if (comment.trim().length < 3) return setFormError('Comment must be at least 3 characters');

    setSaving(true);
    try {
      await api(`/products/${id}/reviews`, { method: 'POST', body: { rating, comment } });
      setRating(0);
      setComment('');
      await load();
    } catch (err) {
      if (err.message.includes('log in')) onLogout(); // stale session
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (error) return <p className="alert">{error}</p>;
  if (!product) return <p className="muted">Loading…</p>;

  const avg = product.reviews.length
    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
    : 0;
  const alreadyReviewed = user && product.reviews.some((r) => r.user_id === user.id);

  return (
    <>
      <a href="#/" className="back">
        ← All products
      </a>

      <section className="panel product-head">
        <div className="emoji big">{product.emoji}</div>
        <div>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <div className="meta">
            <Stars value={avg} />
            <span>
              {avg ? avg.toFixed(1) : '–'} from {product.reviews.length} review
              {product.reviews.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </section>

      <div className="two-col">
        <section className="panel">
          <h2>Write a review</h2>
          {!user ? (
            <p>
              <a href="#/login" className="link">
                Log in with OTP
              </a>{' '}
              to leave a review.
            </p>
          ) : alreadyReviewed ? (
            <p className="muted">You've already reviewed this product. Thanks!</p>
          ) : (
            <form onSubmit={submit}>
              <div className="star-picker" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    type="button"
                    key={n}
                    className={n <= rating ? 'on' : ''}
                    onClick={() => setRating(n)}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                rows="4"
                maxLength="500"
                placeholder="What did you like or dislike?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              {formError && <p className="alert">{formError}</p>}
              <button className="btn" disabled={saving}>
                {saving ? 'Posting…' : 'Post review'}
              </button>
            </form>
          )}
        </section>

        <section>
          <h2>Reviews</h2>
          {product.reviews.length === 0 && <p className="muted">No reviews yet. Be the first!</p>}
          {product.reviews.map((r) => (
            <article key={r.id} className="review">
              <div className="review-top">
                <strong>{r.user_name}</strong>
                <Stars value={r.rating} />
              </div>
              <p>{r.comment}</p>
              <small className="muted">{new Date(r.created_at + 'Z').toLocaleDateString()}</small>
            </article>
          ))}
        </section>
      </div>
    </>
  );
}
