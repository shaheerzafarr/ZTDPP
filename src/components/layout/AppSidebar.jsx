"use client";
import Link from "next/link";
import { Sidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { logout } from "@/store/auth/authSlice";
import {
  Activity,
  BookOpen,
  Boxes,
  Blocks,
  KeyRound,
  LayoutDashboard,
  LogOut,
  ScanSearch,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { usePathname, useRouter } from "next/navigation";
import useAxios from "@/interceptor/useAxios";
import { useState } from "react";
import { clearAllCookies } from "@/resources/utils/cookie";
import { getDisplayName, getInitials, getRoleName } from "@/resources/utils/helper";
import { ROLE_SUPER_ADMIN } from "@/resources/constants/ztdpp";
import { APP_CONFIG } from "@/config";
import classes from "./AppSidebar.module.css";

const userNav = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Verify image", url: "/verify", icon: ScanSearch },
  { title: "Verifications", url: "/verifications", icon: Activity },
  { title: "Assets", url: "/assets", icon: Boxes },
  { title: "API keys", url: "/api-keys", icon: KeyRound },
  { title: "Integration docs", url: "/docs", icon: BookOpen },
];

const adminNav = [
  { title: "Overview", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "API keys", url: "/admin/api-keys", icon: KeyRound },
  { title: "Assets", url: "/admin/assets", icon: Boxes },
  { title: "Verifications", url: "/admin/verifications", icon: Activity },
  { title: "Ledger explorer", url: "/admin/ledger", icon: Blocks },
  { title: "Platform settings", url: "/admin/settings", icon: SlidersHorizontal },
];

function isNavActive(pathname, path) {
  return pathname === path || pathname.startsWith(path + "/");
}

export function AppSidebar({ mode = "user" }) {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const router = useRouter();
  const { Post } = useAxios();
  const { user } = useSelector((state) => state.authReducer);
  const [loading, setLoading] = useState("");

  const role = getRoleName(user);
  const isAdmin = role === ROLE_SUPER_ADMIN;
  const nav = mode === "admin" ? adminNav : userNav;
  const userName = getDisplayName(user) || "User";

  const renderNavRow = (item) => {
    const active = isNavActive(pathname, item.url);
    const Icon = item.icon;
    return (
      <Link
        key={item.url}
        href={item.url}
        className={cn(classes.navLink, active ? classes.navLinkActive : classes.navLinkInactive)}
      >
        {active && <span className={classes.activeIndicator} />}
        <Icon className={classes.navIcon} />
        {item.title}
      </Link>
    );
  };

  const handleLogout = async () => {
    setLoading("logout");
    await Post({ route: "auth/logout", showAlert: false });
    dispatch(logout());
    clearAllCookies();
    router.replace(mode === "admin" ? "/admin/login" : "/login");
    setLoading("");
  };

  return (
    <Sidebar collapsible="offcanvas" className={classes.sidebarRoot}>
      <aside className={cn("sidebar-texture", classes.aside)}>
        <div className={classes.logoWrap}>
          <div className={classes.brand}>
            <span className={classes.brandMark}>
              <ShieldCheck size={20} />
            </span>
            <span className={classes.brandText}>
              <span className={classes.brandName}>{APP_CONFIG.APP_NAME}</span>
              <span className={classes.brandTag}>
                {mode === "admin" ? "Admin console" : "Provenance platform"}
              </span>
            </span>
          </div>
        </div>

        <nav className={classes.nav}>{nav.map(renderNavRow)}</nav>

        <div className={classes.settingsWrap}>
          {mode === "user" && renderNavRow({ title: "Account settings", url: "/settings", icon: Settings })}
          {mode === "admin" && isAdmin && (
            <Link href="/dashboard" className={cn(classes.navLink, classes.navLinkInactive)}>
              <ScanSearch className={classes.navIcon} />
              Switch to user view
            </Link>
          )}
          {mode === "user" && isAdmin && (
            <Link href="/admin/dashboard" className={cn(classes.navLink, classes.navLinkInactive)}>
              <SlidersHorizontal className={classes.navIcon} />
              Admin console
            </Link>
          )}
        </div>

        <div className={classes.userBlock}>
          <div className={classes.userRow}>
            <div className={classes.userInitials}>{getInitials(userName) || "U"}</div>
            <div className={classes.userInfo}>
              <p className={classes.userName}>{userName}</p>
              <span className={classes.userRole}>{role ?? "user"}</span>
            </div>
          </div>
        </div>

        <div className={classes.footer}>
          <button
            className={classes.logoutButton}
            onClick={() => void handleLogout()}
            disabled={loading !== ""}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </Sidebar>
  );
}
