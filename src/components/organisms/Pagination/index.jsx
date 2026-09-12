"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import classes from "./styles.module.css";

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = [1];
  if (currentPage > 3) pages.push("ellipsis");
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (currentPage < totalPages - 2) pages.push("ellipsis");
  pages.push(totalPages);
  return pages;
}

export default function Pagination({ currentPage, totalPages, limitPerPage, onPageChange }) {
  if (totalPages <= 1) return null;
  const pages = getPageNumbers(currentPage, totalPages);
  return (
    <div className={classes.wrapper}>
      <span>Showing {(currentPage - 1) * limitPerPage + 1} - {Math.min(currentPage * limitPerPage, totalPages * limitPerPage)} entries</span>
      <div className={classes.controls}>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
          className={classes.navButton}>
          <ChevronLeft className={classes.navIcon} /> Prev
        </button>
        {pages.map((p, i) => p === "ellipsis" ? (
          <span key={`ellipsis-${i}`} className={classes.ellipsis}>...</span>
        ) : (
          <button key={p} onClick={() => onPageChange(p)}
            className={cn(classes.pageButton, currentPage === p && classes.pageButtonActive)}>
            {p}
          </button>
        ))}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
          className={classes.navButton}>
          Next <ChevronRight className={classes.navIcon} />
        </button>
      </div>
    </div>
  );
}
