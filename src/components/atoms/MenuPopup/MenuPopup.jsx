"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import classes from "./MenuPopup.module.css";

const MENU_MIN_WIDTH = 120;
const GAP = 4;

export default function MenuPopup({ menuButton, items, value, className }) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState({ top: 0, left: 0, maxHeight: 320 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (!open) return;
    const updatePlacement = () => {
      const el = triggerRef.current;
      const menuEl = menuRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const estItem = 36;
      const estimatedH = menuEl?.offsetHeight || items.length * estItem;
      const spaceBelow = window.innerHeight - rect.bottom - GAP;
      const spaceAbove = rect.top - GAP;
      const placeBelow = spaceBelow >= estimatedH || spaceBelow >= spaceAbove;
      const menuH = Math.min(estimatedH, placeBelow ? spaceBelow : spaceAbove);
      let top = placeBelow ? rect.bottom + GAP : rect.top - Math.min(estimatedH, spaceAbove) - GAP;
      if (top + menuH > window.innerHeight - GAP) top = Math.max(GAP, window.innerHeight - menuH - GAP);
      if (top < GAP) top = GAP;
      const maxHeight = Math.min(320, placeBelow ? window.innerHeight - rect.bottom - GAP * 2 : rect.top - GAP * 2);
      setPlacement({ top, left: rect.right, maxHeight: Math.max(80, maxHeight) });
    };
    updatePlacement();
    const menuEl = menuRef.current;
    const ro = menuEl ? new ResizeObserver(updatePlacement) : null;
    if (menuEl && ro) ro.observe(menuEl);
    const closeOnScrollOrResize = () => setOpen(false);
    window.addEventListener("scroll", closeOnScrollOrResize, true);
    window.addEventListener("resize", closeOnScrollOrResize);
    return () => {
      ro?.disconnect();
      window.removeEventListener("scroll", closeOnScrollOrResize, true);
      window.removeEventListener("resize", closeOnScrollOrResize);
    };
  }, [open, items.length]);

  return (
    <div className={classes.root} onClick={(e) => e.stopPropagation()}>
      <div ref={triggerRef} className={classes.trigger}
        onClick={() => setOpen((prev) => { if (!prev) setPlacement({ top: -9999, left: -9999, maxHeight: 320 }); return !prev; })}>
        {menuButton}
      </div>
      {open && createPortal(
        <>
          <div className={classes.overlay} aria-hidden onClick={() => setOpen(false)} />
          <div ref={menuRef}
            style={{ position: "fixed", top: placement.top, left: placement.left, minWidth: MENU_MIN_WIDTH, maxHeight: placement.maxHeight, transform: "translateX(-100%)", zIndex: 9999 }}
            className={cn(classes.menu, className)}>
            <ul className={classes.list}>
              {items?.map((item, i) => {
                const children = item.renderItem ? item.renderItem(value) : item.label;
                return (
                  <li key={i}
                    onClick={() => { if (item.disabled) return; item.onClick?.({ value: value || item.value }); setOpen(false); }}
                    style={item.style}
                    className={cn(classes.item, item.disabled && classes.itemDisabled, item.className)}>
                    {item.type === "link" && item.href ? <a href={item.href} className={classes.link}>{children}</a> : children}
                  </li>
                );
              })}
            </ul>
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}
