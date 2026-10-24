import { useState } from "react";
import { Star } from "lucide-react";
// Read-only display: filled stars rounded to the nearest whole number, plus the numeric average.
export function StarDisplay({ rating, count, className = "" }) {
  if (!count || rating === undefined) {
    return <span className={`text-xs text-muted-foreground ${className}`}>No ratings yet</span>;
  }
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs text-muted-foreground ${className}`}
      aria-label={`Rated ${rating} out of 5 from ${count} ${count === 1 ? "rating" : "ratings"}`}
    >
      <Star className="h-3.5 w-3.5 fill-chart-4 text-chart-4" aria-hidden="true" />
      <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
      <span>({count})</span>
    </span>
  );
}
// Interactive 1–5 picker, built as a radio group so it works with the keyboard.
export function StarInput({ value, onChange, disabled = false }) {
  const [hover, setHover] = useState(null);
  const shown = hover ?? value ?? 0;
  return (
    <div role="radiogroup" aria-label="Your rating" className="inline-flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
          disabled={disabled}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          className="rounded p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Star
            className={`h-6 w-6 transition-colors ${n <= shown ? "fill-chart-4 text-chart-4" : "text-muted-foreground"}`}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}
