"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/resources/utils/helper";
import classes from "./FileDropzone.module.css";

const ACCEPT = "image/jpeg,image/png,image/webp,image/tiff,image/heic,image/heif,image/avif,image/gif,image/bmp";

/**
 * Single image picker with drag & drop and preview.
 * onChange(file | null)
 */
export default function FileDropzone({ file, onChange, disabled = false, maxSizeMb = 20, className, hint }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const accept = useCallback(
    (candidate) => {
      if (!candidate) return;
      if (!candidate.type.startsWith("image/")) {
        setError("Only image files are supported.");
        return;
      }
      if (candidate.size > maxSizeMb * 1024 * 1024) {
        setError(`File is larger than ${maxSizeMb} MB.`);
        return;
      }
      setError("");
      onChange?.(candidate);
    },
    [maxSizeMb, onChange],
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    accept(e.dataTransfer.files?.[0]);
  };

  return (
    <div className={cn(classes.root, className)}>
      {!file ? (
        <div
          role="button"
          tabIndex={0}
          className={cn(classes.zone, dragging && classes.dragging, disabled && classes.disabled)}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <div className={classes.icon}>
            <ImagePlus size={24} />
          </div>
          <p className={classes.title}>Drop an image here or click to browse</p>
          <p className={classes.sub}>{hint ?? `JPEG, PNG, WebP, HEIC, TIFF · up to ${maxSizeMb} MB`}</p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            hidden
            disabled={disabled}
            onChange={(e) => {
              accept(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      ) : (
        <div className={classes.previewRow}>
          {preview && <img src={preview} alt={file.name} className={classes.preview} />}
          <div className={classes.meta}>
            <p className={classes.name}>{file.name}</p>
            <p className={classes.sub}>
              {file.type || "image"} · {formatBytes(file.size)}
            </p>
          </div>
          {!disabled && (
            <button type="button" className={classes.remove} onClick={() => onChange?.(null)} aria-label="Remove">
              <X size={16} />
            </button>
          )}
        </div>
      )}
      {error && <p className={classes.error}>{error}</p>}
    </div>
  );
}
