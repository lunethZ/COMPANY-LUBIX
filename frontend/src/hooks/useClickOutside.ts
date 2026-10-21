import { useEffect, type RefObject } from "react";

/**
 * Cierra el menú desplegable al hacer clic fuera del elemento referenciado.
 * Se suscribe solo cuando `active` es true para no dejar listeners huérfanos.
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void,
  active: boolean
) {
  useEffect(() => {
    if (!active) return;

    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [ref, handler, active]);
}
