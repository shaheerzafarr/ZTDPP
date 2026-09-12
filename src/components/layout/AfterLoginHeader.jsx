"use client";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import classes from "./AfterLoginHeader.module.css";

export default function AfterLoginHeader({ children }) {
  return (
    <SidebarInset className={classes.inset}>
      <div className={classes.mobileBar}>
        <SidebarTrigger />
      </div>
      <main className={classes.main}>{children}</main>
    </SidebarInset>
  );
}
