"use client";

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import useAxios from "@/interceptor/useAxios";
import { logout, updateUserData } from "@/store/auth/authSlice";

/**
 * Re-validates the persisted session once per page load by fetching the
 * current user. A 401 that the refresh interceptor cannot recover from
 * clears the session.
 */
export function ApisProvider({ children }) {
  const isAuthenticated = useSelector((state) => state.authReducer.isAuthenticated);
  const dispatch = useDispatch();
  const { Get } = useAxios();
  const checked = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || checked.current) return;
    checked.current = true;

    const refresh = async () => {
      const { response, status } = await Get({ route: "users/me", showAlert: false });
      if (response?.data) dispatch(updateUserData(response.data));
      else if (status === 401 || status === 403) dispatch(logout());
    };

    void refresh();
  }, [isAuthenticated]);

  return <>{children}</>;
}
