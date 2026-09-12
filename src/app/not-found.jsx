"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import classes from "./not-found.module.css";

export default function NotFound() {
  const pathname = usePathname();
  return (
    <div className={classes.wrapper}>
      <h1 className={classes.code}>404</h1>
      <h2 className={classes.title}>Page Not Found</h2>
      <p className={classes.description}>
        The page <code className={classes.path}>{pathname}</code> could not be found.
      </p>
      <Link href="/dashboard" className={classes.link}>
        Go to Dashboard
      </Link>
    </div>
  );
}
