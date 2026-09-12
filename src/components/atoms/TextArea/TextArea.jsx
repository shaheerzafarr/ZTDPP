"use client";
import { useId } from "react";
import { cn } from "@/lib/utils";
import classes from "./TextArea.module.css";

export default function TextArea({
  value = "", setValue = () => {}, label = "", label2 = "", placeholder = "",
  rows = 3, className = "", containerClass = "", disabled = false, labelClass = "",
  error = "", required = false, children, name, maxLength, onInputBlur,
}) {
  const textAreaId = useId();
  return (
    <div className={cn(classes.container, containerClass)}>
      {(label || label2) && (
        <div className={classes.labelRow}>
          {label && (
            <label htmlFor={textAreaId} className={cn(classes.label, disabled && classes.labelDisabled, labelClass)}>
              {label}{required && <span className={classes.required}>*</span>}
            </label>
          )}
          {label2 && <span className={classes.label2}>{label2}</span>}
        </div>
      )}
      <textarea id={textAreaId} name={name} placeholder={placeholder} value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={(e) => { setValue(e.target.value.trim()); onInputBlur?.(e); }}
        className={cn(classes.textarea, error && classes.textareaError, className)}
        rows={rows} disabled={disabled} maxLength={maxLength} />
      {error && <p className={classes.errorText}>*{error}</p>}
      {children}
    </div>
  );
}
