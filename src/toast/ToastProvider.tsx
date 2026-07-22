import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { ToastContext } from "./context";

interface Toast {
  id: number;
  message: string;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const notify = useCallback((message: string) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="glass pointer-events-auto flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-plops-ink shadow-soft animate-[float_0.3s_ease]"
          >
            <span className="text-base">🫧</span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
