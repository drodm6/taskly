import { WORKSPACE_COLORS } from "../../constants";
import { filterEmojiOnly } from "../../utils/date";

// =========================================================
// UI PRIMITIVES
// The long Tailwind strings that used to be repeated 15+
// times now live here once each.
// =========================================================

// shared base so every input in the app is exactly the same size.
// shrink-0 matters inside tall scrolling modals, where flex children
// would otherwise be compressed below their set height.
// text-[16px] is deliberate: iOS Safari auto-zooms the whole page when
// you focus an input smaller than 16px, which made the layout jump.
const INPUT_BASE =
  "shrink-0 h-11 px-3 text-[16px] rounded-lg bg-transparent border-2 border-[var(--color-border)] " +
  "text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-none " +
  "focus:border-[var(--color-accent)] transition-colors";

export function TextField({ value, onChange, placeholder, maxLength, disabled, className = "" }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={disabled}
      className={`${INPUT_BASE} disabled:opacity-60 ${className}`}
    />
  );
}

// icon picker that accepts emoji only — typed letters/numbers are
// discarded as they're entered, so the field can never hold text.
// Optional: leaving it empty is valid.
export function EmojiField({ value, onChange, className = "" }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(filterEmojiOnly(e.target.value))}
      placeholder="💼"
      inputMode="text"
      title="Emoji only — letters and numbers aren't accepted"
      className={`${INPUT_BASE} text-center ${className}`}
    />
  );
}

// date/time field with a label above it. The custom placeholder shows
// only on mobile (sm:hidden) — desktop browsers draw their own.
// min-w-0 stops the native intrinsic width from making these wider
// than the plain text inputs next to them.
export function DateTimeField({ label, type, value, onChange, min, placeholder }) {
  return (
    <div className="flex flex-col gap-1 w-full min-w-0">
      <label className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide">
        {label}
      </label>
      <div className="relative w-full min-w-0">
        <input
          type={type}
          value={value}
          min={min}
          onChange={onChange}
          className={`${INPUT_BASE} w-full min-w-0`}
        />
        {!value && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-[var(--color-ink-muted)] pointer-events-none sm:hidden">
            {placeholder}
          </span>
        )}
      </div>
    </div>
  );
}

export function PrimaryButton({ onClick, children, className = "" }) {
  return (
    <button
      onClick={onClick}
      // active:brightness instead of active:translate — a transform moved
      // the button out from under your finger mid-tap, so touchend landed
      // outside it and no click fired. That's what caused the
      // "have to press it several times" behaviour.
      className={`px-4 py-2.5 text-[15px] font-semibold rounded-lg bg-[var(--color-accent)] text-black hover:brightness-110 active:brightness-90 transition-all ${className}`}
    >
      {children}
    </button>
  );
}

export function OutlineButton({ onClick, children, muted = false, className = "" }) {
  const tone = muted
    ? "border-[var(--color-ink-muted)] text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
    : "border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent-light)]";

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-[15px] font-semibold rounded-lg bg-transparent border-2 transition-colors ${tone} ${className}`}
    >
      {children}
    </button>
  );
}

export function SectionLabel({ children, className = "" }) {
  return (
    <p
      className={`text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide m-0 ${className}`}
    >
      {children}
    </p>
  );
}

export function SegmentedControl({ options, value, onChange }) {
  return (
    // shrink-0: inside a scrolling flex-col modal, children shrink by
    // default — which squashed these buttons until the labels clipped
    <div className="shrink-0 flex rounded-lg border-2 border-[var(--color-border)] overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-3 text-[15px] font-bold transition-colors ${
            value === opt.value
              ? "bg-[var(--color-accent)] text-black"
              : "bg-transparent text-[var(--color-ink-muted)]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function ColorSwatchRow({ selectedColor, onSelect }) {
  return (
    <div className="flex-1 flex flex-wrap gap-2">
      {WORKSPACE_COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onSelect(c.value)}
          title={c.name}
          style={{ backgroundColor: c.value }}
          className={`w-7 h-7 rounded-full border-2 transition-transform ${
            selectedColor === c.value ? "border-white scale-110" : "border-transparent"
          }`}
        />
      ))}
    </div>
  );
}

export function GhostToggle({ active, onClick, size = "w-11 h-11" }) {
  return (
    <button
      onClick={onClick}
      aria-label="Toggle hidden workspace"
      title="Hidden workspaces only appear under 👻 Hidden"
      className={`shrink-0 ${size} rounded-full border-2 flex items-center justify-center transition-colors ${
        active
          ? "bg-[var(--color-accent)] border-[var(--color-accent)]"
          : "border-[var(--color-ink-muted)]"
      }`}
    >
      👻
    </button>
  );
}

export function StatCard({ label, value }) {
  return (
    <div className="border border-[var(--color-border)] rounded-lg p-3.5 flex flex-col items-center justify-center gap-1 text-center">
      <span className="text-2xl font-bold text-[var(--color-accent)]">{value}</span>
      <span className="text-xs text-[var(--color-ink-muted)]">{label}</span>
    </div>
  );
}