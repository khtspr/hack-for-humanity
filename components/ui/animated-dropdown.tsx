"use client";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export interface DropdownOption<T extends string = string> { value: T; label: string }

interface AnimatedDropdownProps<T extends string> {
  /** Goes on the trigger button, so a <label htmlFor={id}> focuses it. */
  id: string;
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
}

/** Animated replacement for a native <select>: listbox semantics, keyboard support, click-outside close. */
export default function AnimatedDropdown<T extends string>({ id, value, options, onChange }: AnimatedDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const openList = () => { setActive(selectedIndex); setOpen(true); };
  const choose = (index: number) => { onChange(options[index].value); setOpen(false); root.current?.querySelector("button")?.focus(); };

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape" && open) { event.preventDefault(); setOpen(false); return; }
    if (event.key === "Tab") { setOpen(false); return; }
    if (!["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(event.key)) return;
    event.preventDefault();
    if (!open) { if (event.key !== "Home" && event.key !== "End") openList(); return; }
    if (event.key === "Enter" || event.key === " ") choose(active);
    else if (event.key === "Home") setActive(0);
    else if (event.key === "End") setActive(options.length - 1);
    else setActive((current) => (current + (event.key === "ArrowDown" ? 1 : options.length - 1)) % options.length);
  }

  return (
    <div className="dropdown" ref={root} onKeyDown={onKeyDown}>
      <button
        id={id} type="button" className="dropdown-trigger"
        role="combobox" aria-haspopup="listbox" aria-expanded={open} aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
      >
        <span>{options[selectedIndex]?.label}</span>
        <motion.span className="dropdown-chevron" aria-hidden="true" animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2, ease: "easeInOut" }}>
          <ChevronDown size={18} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            id={listId} role="listbox" className="dropdown-list"
            initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {options.map((option, index) => (
              <motion.li
                key={option.value} id={`${listId}-${index}`} role="option" aria-selected={option.value === value}
                className="dropdown-option" data-active={index === active || undefined}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0, transition: { delay: index * 0.025 } }}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(index)}
              >
                {option.label}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
