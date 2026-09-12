"use client";
import { GripVertical, Loader2 } from "lucide-react";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import Pagination from "@/components/organisms/Pagination";
import { cn } from "@/lib/utils";
import classes from "./styles.module.css";

export default function AppTable({
  data = [], tableHeader = [], loading = false, noDataText = "No data found",
  page = 1, totalRecords = 0, limitPerPage = 10, onPageChange, actions = [],
  onRowClick, rowClassName, onReorder,
}) {
  const totalPages = Math.ceil(totalRecords / limitPerPage);
  const isDraggable = Boolean(onReorder);
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const handleDrop = () => {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      const next = [...data];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(overIndex, 0, moved);
      onReorder?.(next);
    }
    setDragIndex(null);
    setOverIndex(null);
  };

  const emptyColSpan = tableHeader.length + (actions.length > 0 ? 1 : 0) + (isDraggable ? 1 : 0);

  return (
    <div className={classes.wrapper}>
      <Card className={classes.card}>
        <CardContent className={classes.cardContent}>
          {loading ? (
            <div className={classes.loaderWrap}>
              <Loader2 className={classes.loader} />
            </div>
          ) : (
            <Table>
              <TableHeader className={classes.thead}>
                <TableRow>
                  {isDraggable && <TableHead className={classes.dragHead} />}
                  {tableHeader.map((col, i) => (
                    <TableHead key={i} style={col.style} className={classes.th}>
                      {col.title}
                    </TableHead>
                  ))}
                  {actions.length > 0 && (
                    <TableHead className={classes.thActions}>Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length > 0 ? (
                  data.map((item, rowIndex) => (
                    <TableRow key={rowIndex}
                      draggable={isDraggable}
                      onDragStart={isDraggable ? () => setDragIndex(rowIndex) : undefined}
                      onDragOver={isDraggable ? (e) => { e.preventDefault(); setOverIndex(rowIndex); } : undefined}
                      onDrop={isDraggable ? (e) => { e.preventDefault(); handleDrop(); } : undefined}
                      onDragEnd={isDraggable ? handleDrop : undefined}
                      className={cn(
                        onRowClick && classes.rowClickable,
                        classes.row,
                        isDraggable && overIndex === rowIndex && dragIndex !== rowIndex && classes.rowDropTarget,
                        isDraggable && dragIndex === rowIndex && classes.rowDragging,
                        rowClassName,
                      )}
                      tabIndex={onRowClick ? 0 : undefined}
                      role={onRowClick ? "button" : undefined}
                      onClick={() => onRowClick?.(item, rowIndex)}
                      onKeyDown={(e) => { if (onRowClick && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onRowClick(item, rowIndex); } }}>
                      {isDraggable && (
                        <TableCell className={classes.dragCell}>
                          <GripVertical className={classes.dragHandle} aria-hidden />
                        </TableCell>
                      )}
                      {tableHeader.map((col, colIndex) => (
                        <TableCell key={colIndex} style={col.style} className={classes.cell}>
                          {col.renderItem ? col.renderItem({ item: item[col.key], data: item, colIndex, rowIndex, key: col.key, title: col.title }) : item[col.key] || "N/A"}
                        </TableCell>
                      ))}
                      {actions.length > 0 && (
                        <TableCell className={classes.actionsCell}>
                          <div className={classes.actionsInner}>
                            {actions.map((action, ai) => (
                              <button key={ai} type="button" aria-label={`Action ${ai + 1} for row ${rowIndex + 1}`}
                                onClick={(e) => { e.stopPropagation(); action.onClick?.({ data: item }); }}>
                                {action.renderItem?.({ data: item })}
                              </button>
                            ))}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={emptyColSpan} className={classes.emptyCell}>{noDataText}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {onPageChange && totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} limitPerPage={limitPerPage} onPageChange={onPageChange} />
      )}
    </div>
  );
}
