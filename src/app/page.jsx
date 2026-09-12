"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { getDashboardPathFromRole } from "@/resources/utils/authRedirect";
import { getRoleName } from "@/resources/utils/helper";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state) => state.authReducer);

  useEffect(() => {
    router.replace(isAuthenticated ? getDashboardPathFromRole(getRoleName(user)) : "/login");
  }, [isAuthenticated, user, router]);

  return null;
}
