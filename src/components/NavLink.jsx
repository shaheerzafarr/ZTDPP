"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLink({ href, children, className, activeClassName = "active", end = false, ...props }) {
  const pathname = usePathname();
  const hrefStr = href.toString();
  const isActive = end ? pathname === hrefStr : pathname === hrefStr || pathname.startsWith(hrefStr + "/");
  const resolvedClassName = typeof className === "function" ? className(isActive) : cn(className, isActive && activeClassName);

  return (
    <Link href={href} className={resolvedClassName} {...props}>
      {children}
    </Link>
  );
}

export default NavLink;
