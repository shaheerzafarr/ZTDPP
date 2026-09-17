"use client";

import { APP_CONFIG } from "@/config";
import { logout, setAccessToken } from "@/store/auth/authSlice";
import axios from "axios";
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

/**
 * Backend error envelope (AnyExceptionFilter):
 *   { status: "fail", message: { error: string[] }, statusCode }
 * Success envelope: { data, ...extra }
 */
export function extractErrorMessage(error, fallback = "Something went wrong") {
  const payload = error?.response?.data;
  const message = payload?.message;
  if (Array.isArray(message?.error)) return message.error.join(", ");
  if (typeof message?.error === "string") return message.error;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string") return message;
  if (error?.code === "ERR_NETWORK") return "Cannot reach the API server.";
  return error?.message ?? fallback;
}

let refreshPromise = null;
const bare = axios.create({
  baseURL: APP_CONFIG.API_BASE_URL,
  withCredentials: true,
  headers: { "X-Requested-With": "XMLHttpRequest" },
});

export default function useAxios() {
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.authReducer.accessToken);

  const axiosInstance = useMemo(() => {
    const instance = axios.create({
      baseURL: APP_CONFIG.API_BASE_URL,
      withCredentials: true,
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });

    instance.interceptors.request.use(
      (config) => {
        if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
        return config;
      },
      (error) => Promise.reject(error),
    );

    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        const isAuthRoute = /auth\/(user|admin)\/login|auth\/refresh-token|auth\/signup/.test(
          originalRequest?.url ?? "",
        );

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
          originalRequest._retry = true;
          try {
            if (!refreshPromise) {
              const refresh = () => bare.post("auth/refresh-token");
              refreshPromise = (navigator.locks ? navigator.locks.request("ztdpp-session-refresh", refresh) : refresh())
                .finally(() => { refreshPromise = null; });
            }
            const res = await refreshPromise;
            const newToken = res.data?.data?.token;
            if (newToken) dispatch(setAccessToken(newToken));
            return instance(originalRequest);
          } catch {
            dispatch(logout());
            if (typeof window !== "undefined") {
              const onAdmin = window.location.pathname.startsWith("/admin");
              window.location.href = onAdmin ? "/admin/login" : "/login";
            }
          }
        }
        return Promise.reject(error);
      },
    );

    return instance;
  }, [accessToken, dispatch]);

  const handleRequest = useCallback(
    async (method, options) => {
      const {
        route,
        data,
        params,
        showAlert = true,
        headers,
        onUploadProgress,
        timeout,
      } = options;
      try {
        const config = { params, headers, onUploadProgress, timeout };
        let res;
        if (method === "get" || method === "delete") {
          res = await axiosInstance[method](route, config);
        } else {
          res = await axiosInstance[method](route, data, config);
        }
        return { response: res.data, error: null, status: res.status };
      } catch (error) {
        const message = extractErrorMessage(error);
        if (showAlert && axios.isAxiosError(error)) toast.error(message);
        return { response: null, error, message, status: error?.response?.status };
      }
    },
    [axiosInstance],
  );

  const Get = useCallback((options) => handleRequest("get", options), [handleRequest]);
  const Post = useCallback((options) => handleRequest("post", options), [handleRequest]);
  const Put = useCallback((options) => handleRequest("put", options), [handleRequest]);
  const Patch = useCallback((options) => handleRequest("patch", options), [handleRequest]);
  const Delete = useCallback((options) => handleRequest("delete", options), [handleRequest]);

  return { Get, Post, Put, Patch, Delete };
}
