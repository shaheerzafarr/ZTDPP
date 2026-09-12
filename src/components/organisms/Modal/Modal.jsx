"use client";
import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import classes from "./Modal.module.css";

const sizeClasses = { small: classes.small, medium: classes.medium, large: classes.large, extraLarge: classes.extraLarge };

export default function Modal({
  show = false, setShow, onClose, children, title, size = "medium",
  showCloseButton = true, closeOnOverlayClick = true, closeOnEscape = true,
  className = "", showHeader = true, footer, showFooter = false,
}) {
  const modalRef = useRef(null);
  const handleClose = useCallback(() => { onClose ? onClose() : setShow?.(false); }, [onClose, setShow]);

  useEffect(() => {
    if (!show) return;
    const handleEsc = (e) => { if (closeOnEscape && e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", handleEsc);
    document.documentElement.style.overflowY = "hidden";
    return () => { document.removeEventListener("keydown", handleEsc); document.documentElement.style.overflowY = "auto"; };
  }, [show, closeOnEscape, handleClose]);

  if (!show) return null;

  return createPortal(
    <dialog ref={modalRef} open
      className={classes.overlay}
      onClick={(e) => { if (closeOnOverlayClick && e.target === modalRef.current) handleClose(); }}>
      <div className={cn(classes.panel, sizeClasses[size], className)} onClick={(e) => e.stopPropagation()}>
        {showHeader && (
          <div className={classes.header}>
            {title && <h2 className={classes.title}>{title}</h2>}
            {showCloseButton && (
              <button type="button" onClick={handleClose} className={classes.closeButton}>
                <X size={20} />
              </button>
            )}
          </div>
        )}
        <div className={classes.body}>{children}</div>
        {showFooter && footer && (
          <div className={classes.footer}>{footer}</div>
        )}
      </div>
    </dialog>,
    document.body,
  );
}
