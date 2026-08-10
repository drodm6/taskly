// =========================================================
// Modal — the shared overlay + panel frame
//
// z-40 for all modals; the edit modal passes z-50 so it stays
// visible when opened from inside the settings modal.
// =========================================================

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-[380px]",
  zIndex = "z-40",
  closeOnBackdrop = false,
  showCloseButton = false,
}) {
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndex} bg-black/60 flex justify-center items-center px-4 py-8`}
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 flex flex-col gap-3 shadow-[0_12px_30px_rgba(0,0,0,0.6)]`}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-[var(--font-display)] text-lg text-[var(--color-ink)] m-0">
            {title}
          </h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] text-xl leading-none"
            >
              ✕
            </button>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}