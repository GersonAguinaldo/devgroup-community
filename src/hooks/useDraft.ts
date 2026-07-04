import { useEffect, useRef, useState } from "react";

/**
 * Sauvegarde un objet sérialisable dans localStorage sous une clé donnée.
 * - Restaure automatiquement au montage.
 * - Débounce l'écriture (500 ms).
 * - `clear()` supprime la clé (à appeler après publication).
 */
export function useDraft<T extends Record<string, any>>(
  key: string,
  initial: T,
) {
  const [value, setValue] = useState<T>(initial);
  const [restored, setRestored] = useState(false);
  const timer = useRef<number | null>(null);
  const loaded = useRef(false);

  // Restaure une fois au montage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setValue({ ...initial, ...parsed });
          setRestored(true);
        }
      }
    } catch {
      /* ignore */
    }
    loaded.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Sauvegarde débouncée
  useEffect(() => {
    if (!loaded.current) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* ignore quota */
      }
    }, 500);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [key, value]);

  const clear = () => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    setRestored(false);
  };

  return { value, setValue, restored, dismissRestored: () => setRestored(false), clear };
}
