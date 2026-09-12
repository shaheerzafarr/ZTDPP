"use client";
import React, { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import classes from "./CustomInput.module.css";

export default function CustomInput({
  type = "text",
  label = "",
  value = "",
  setValue = () => {},
  placeholder = "",
  disabled = false,
  error = "",
  leftIcon = null,
  rightIcon = null,
  className = "",
  required = false,
  maxLength = 50,
  onEnterClick,
  name,
  inputClassName = "",
  min = 0,
  max,
}) {
  const [show, setShow] = useState(false);
  const inputId = useId();

  return (
    <div className={cn(classes.container, className)}>
      {label && (
        <label htmlFor={inputId} className={classes.label}>
          {label}
          {required && <span className={classes.required}>*</span>}
        </label>
      )}
      <div className={classes.inputWrapper}>
        {leftIcon && <div className={classes.leftIcon}>{leftIcon}</div>}
        <input
          id={inputId}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          type={show ? "text" : type}
          min={type === "number" || type.includes("date") ? min : undefined}
          max={type === "number" || type.includes("date") ? max : undefined}
          className={cn(
            classes.input,
            inputClassName,
            leftIcon && classes.hasLeftIcon,
            (rightIcon || type === "password") && classes.hasRightIcon,
            error && classes.inputError
          )}
          onKeyDown={(e) => {
            if (type === "number") {
              if ((typeof max === "number" && Number(`${value}${e.key}`) > max) ||
                  (typeof min === "number" && Number(`${value}${e.key}`) < min)) {
                return e.preventDefault();
              }
              if (e.key === "-" && (e.target.selectionStart === 0 || e.target.value === "")) {
                // allow
              } else if (["e", "E", "+"].includes(e.key)) {
                return e.preventDefault();
              }
            }
            if (["Enter", "NumpadEnter"].includes(e.code)) onEnterClick?.();
          }}
          onWheel={(e) => { if (type === "number") e.target.blur(); }}
          onBlur={() => {
            if (typeof value === "string" && (type === "text" || type === "") && setValue) {
              setValue(value.trim());
            }
          }}
          maxLength={maxLength}
        />
        {rightIcon && type !== "password" && (
          <div className={classes.rightIcon}>{rightIcon}</div>
        )}
        {type === "password" && (
          <button type="button" onClick={() => setShow(!show)} className={classes.toggleButton}>
            {show ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        )}
      </div>
      {error && <p className={classes.errorText}>*{error}</p>}
    </div>
  );
}
