import { PrimaryButton, OutlineButton, SectionLabel } from "../ui";

// =========================================================
// WelcomeModal — shown once, on first launch
//
// Doubles as the notification permission prompt: browsers only
// grant permission when it's requested from a real user gesture
// (a click), never automatically on page load.
// =========================================================

export function WelcomeModal({
  open,
  onDismiss,
  onEnableNotifications,
  canAskNotifications,
  theme,
  onSelectTheme,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex justify-center items-center px-4 py-8">
      <div className="w-full max-w-[400px] max-h-[90vh] overflow-y-auto overscroll-contain bg-[var(--color-surface)] border-2 border-[var(--color-accent)] rounded-2xl p-7 flex flex-col gap-4 shadow-[0_20px_50px_rgba(249,115,22,0.15)]">

        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent)] flex items-center justify-center text-3xl font-black text-black">
            T
          </div>

          <h2 className="font-[var(--font-display)] text-2xl font-semibold uppercase tracking-wide text-[var(--color-ink)] m-0">
            Welcome to Taskly
          </h2>

          <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed m-0">
            A progressive web app for organizing your life — built by{" "}
            <span className="text-[var(--color-accent)] font-semibold">Drod</span>.
          </p>
        </div>

        <div className="h-px bg-[var(--color-border)]" />

        <div className="flex flex-col gap-2.5">
          <Feature icon="📁" title="Projects">
            Group tasks into color-coded workspaces, and hide the private ones.
          </Feature>
          <Feature icon="⏱" title="Countdowns">
            Give a task a deadline and watch the time tick down live.
          </Feature>
          <Feature icon="📊" title="Dashboard">
            Track your progress across every project at a glance.
          </Feature>
          <Feature icon="🔒" title="Private by design">
            Everything is saved on this device. No account, no server, no tracking.
          </Feature>
        </div>

        <div className="h-px bg-[var(--color-border)]" />

        {/* theme picker — the choice is applied live, so tapping an
            option previews it immediately behind the modal */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Choose your look</SectionLabel>
          <div className="flex gap-2.5">
            <ThemeChoice
              active={theme === "dark"}
              onClick={() => onSelectTheme("dark")}
              swatch="bg-[#0a0a0a] border-[#262626]"
              icon="🌙"
              label="Dark"
            />
            <ThemeChoice
              active={theme === "light"}
              onClick={() => onSelectTheme("light")}
              swatch="bg-white border-[#d4d4d4]"
              icon="☀️"
              label="Light"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-1">
          {canAskNotifications && (
            <OutlineButton onClick={onEnableNotifications}>
              🔔 Enable reminders
            </OutlineButton>
          )}
          <PrimaryButton onClick={onDismiss}>Get started</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function ThemeChoice({ active, onClick, swatch, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-lg border-2 transition-colors ${
        active
          ? "border-[var(--color-accent)] bg-[var(--color-accent-light)]"
          : "border-[var(--color-border)]"
      }`}
    >
      {/* a small preview of the actual page colour, with an orange
          accent bar so both options read as the same brand */}
      <span className={`w-10 h-6 rounded border ${swatch} flex items-center justify-end pr-1`}>
        <span className="w-2 h-3 rounded-sm bg-[#f97316]" />
      </span>
      <span className="text-xs font-semibold text-[var(--color-ink)]">
        {icon} {label}
      </span>
    </button>
  );
}

function Feature({ icon, title, children }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="text-lg shrink-0 w-6 text-center">{icon}</span>
      <p className="text-sm text-[var(--color-ink-muted)] leading-snug m-0">
        <span className="text-[var(--color-ink)] font-semibold">{title}</span> — {children}
      </p>
    </div>
  );
}