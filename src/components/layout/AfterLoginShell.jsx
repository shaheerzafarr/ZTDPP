"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { SidebarProvider } from "@/components/ui/sidebar";
import AfterLoginHeader from "@/components/layout/AfterLoginHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { getRoleName } from "@/resources/utils/helper";
import { ROLE_SUPER_ADMIN } from "@/resources/constants/ztdpp";
import classes from "./AfterLoginShell.module.css";

/**
 * Authenticated shell. `mode="admin"` additionally requires the super-admin
 * role and redirects everyone else to the user dashboard.
 */
export default function AfterLoginShell({ children, mode = "user" }) {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state) => state.authReducer);
  const role = getRoleName(user);
  const allowed = isAuthenticated && (mode !== "admin" || role === ROLE_SUPER_ADMIN);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(mode === "admin" ? "/admin/login" : "/login");
    } else if (mode === "admin" && role !== ROLE_SUPER_ADMIN) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, role, mode, router]);

  if (!allowed) return null;

  return (
    <SidebarProvider defaultOpen style={{ "--sidebar-width": "16rem" }}>
      <div className={classes.shell}>
        <AppSidebar mode={mode} />
        <AfterLoginHeader>{children}</AfterLoginHeader>
      </div>
    </SidebarProvider>
  );
}
