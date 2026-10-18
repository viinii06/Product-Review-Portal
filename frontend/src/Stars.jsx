export default function Stars({ value }) {
  const rounded = Math.round(value || 0);
  return (
    <span className="stars" aria-label={`${value || 0} out of 5`}>
      {'★'.repeat(rounded)}
      <span className="stars-off">{'★'.repeat(5 - rounded)}</span>
    </span>
  );
}
