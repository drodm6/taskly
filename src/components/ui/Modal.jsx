import { useEffect } from "react";

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
  // freeze the page behind the modal, so scrolling inside it doesn't
  // drag the whole app around underneath — the main thing that makes
  // a web modal feel like a web page instead of an app screen
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndex} bg-black/60 flex justify-center items-center px-4 py-8`}
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        // overscroll-contain stops a scroll that reaches the modal's
        // edge from continuing on into the page behind it
        className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto overscroll-contain bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 flex flex-col gap-3 shadow-[0_12px_30px_rgba(0,0,0,0.6)]`}
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