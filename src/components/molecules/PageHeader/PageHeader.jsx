"use client";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import classes from "./PageHeader.module.css";

export function PageHeader({
  title,
  subtitle,
  description,
  actions,
  backHref,
  breadcrumbs,
  className,
}) {
  const { dir } = useI18n();
  const sub = description ?? subtitle;

  return (
    <div className={cn(classes.root, className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className={classes.breadcrumbs}>
          {breadcrumbs.map((c, i) => (
            <span key={i} className={classes.crumb}>
              {c.href ? (
                <Link href={c.href} className={classes.crumbLink}>
                  {c.label}
                </Link>
              ) : (
                <span className={classes.crumbCurrent}>{c.label}</span>
              )}
              {i < breadcrumbs.length - 1 && (
                <ChevronRight className={classes.crumbSeparator} />
              )}
            </span>
          ))}
        </nav>
      )}
      <div className={classes.bar}>
        <div className={classes.titleGroup}>
          {backHref && (
            <Link href={backHref} className={classes.backLink} aria-label="Back">
              <ArrowLeft className={cn(classes.backIcon, dir === "rtl" && classes.flipped)} />
            </Link>
          )}
          <div className={classes.titleText}>
            <h1 className={classes.title}>{title}</h1>
            {sub && <p className={classes.subtitle}>{sub}</p>}
          </div>
        </div>
        {actions && <div className={classes.actions}>{actions}</div>}
      </div>
    </div>
  );
}

export default PageHeader;
