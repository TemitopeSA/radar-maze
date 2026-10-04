import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/** Shared count of open dialogs so global shortcuts (like the tour's) can step aside. */
export const dialogStack = { count: 0 };

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function trapTab(e: KeyboardEvent | React.KeyboardEvent, container: HTMLElement, extra: HTMLElement[] = []) {
  if (e.key !== 'Tab') return;
  const items = [...Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)), ...extra].filter((el) => el.offsetParent !== null || el === document.activeElement);
  if (!items.length) return;
  const index = items.indexOf(document.activeElement as HTMLElement);
  e.preventDefault();
  const next = e.shiftKey ? (index <= 0 ? items.length - 1 : index - 1) : index === items.length - 1 ? 0 : index + 1;
  items[next].focus();
}

interface ModalProps {
  title: string;
  kicker?: string;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'center' | 'drawer';
  closeOnBackdrop?: boolean;
}

export function Modal({ title, kicker, description, onClose, children, footer, size = 'md', variant = 'center', closeOnBackdrop = true }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogStack.count += 1;
    const el = ref.current!;
    const first = el.querySelector<HTMLElement>('[data-autofocus]') ?? el.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
      } else trapTab(e, el);
    };
    el.addEventListener('keydown', onKey);
    return () => {
      dialogStack.count -= 1;
      el.removeEventListener('keydown', onKey);
      if (previous && document.contains(previous)) previous.focus();
    };
  }, []);

  return createPortal(
    <div className={`modal-backdrop modal-backdrop--${variant}`} onMouseDown={(e) => closeOnBackdrop && e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={`modal modal--${size} modal--${variant}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="modal__header">
          <div>
            {kicker && <div className="kicker">{kicker}</div>}
            <h2 id={titleId} className="modal__title">{title}</h2>
            {description && <p className="modal__desc">{description}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
