"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import classes from "./CustomButton.module.css";

export default function CustomButton({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  loading = false,
  className = "",
  leftIcon,
  rightIcon,
  fullWidth = false,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      data-variant={variant}
      className={cn(classes.btn, fullWidth && classes.fullWidth, className)}
    >
      {loading ? <Loader2 className={classes.spinner} size={18} /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
