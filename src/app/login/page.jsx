"use client";

import CustomButton from "@/components/atoms/CustomButton/CustomButton";
import CustomInput from "@/components/atoms/CustomInput/CustomInput";
import AuthLayout from "@/components/layout/AuthLayout";
import useAxios from "@/interceptor/useAxios";
import { zodValidate } from "@/lib/zodValidate";
import { getDashboardPathFromRole, getStoredDashboardPath } from "@/resources/utils/authRedirect";
import { setUserRoleCookie } from "@/resources/utils/cookie";
import { getRoleName } from "@/resources/utils/helper";
import { saveLoginUserData, setResetEmail, setVerifyOtpType } from "@/store/auth/authSlice";
import { useFormik } from "formik";
import { Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { z } from "zod";
import classes from "./page.module.css";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required").min(8, "At least 8 characters"),
});

export default function LoginPage() {
  const router = useRouter();
  const { Post } = useAxios();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const isAuthenticated = useSelector((state) => state.authReducer.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) router.replace(getStoredDashboardPath());
  }, [isAuthenticated, router]);

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validate: zodValidate(loginSchema),
    onSubmit: async (values) => {
      setLoading(true);
      const { response } = await Post({ route: "auth/user/login", data: values });
      setLoading(false);
      if (!response) return;

      // Unverified accounts get an OTP instead of a session.
      if (response.message && !response.data) {
        dispatch(setResetEmail(values.email));
        dispatch(setVerifyOtpType("signUp"));
        toast.info(response.message);
        router.push("/verify-otp");
        return;
      }

      const user = response.data?.user;
      const role = getRoleName(user);
      setUserRoleCookie(role);
      dispatch(saveLoginUserData({ user, accessToken: response.data?.token ?? null }));
      toast.success(`Welcome back, ${user?.firstName ?? "there"}`);
      router.push(getDashboardPathFromRole(role));
    },
  });

  return (
    <AuthLayout>
      <div className={classes.header}>
        <h1 className={classes.title}>Sign in</h1>
        <p className={classes.subtitle}>Access your provenance dashboard and API keys.</p>
      </div>

      <form onSubmit={formik.handleSubmit} className={classes.form}>
        <CustomInput
          label="Email"
          type="email"
          name="email"
          placeholder="you@company.com"
          value={formik.values.email}
          setValue={(val) => formik.setFieldValue("email", val)}
          error={formik.touched.email && formik.errors.email ? formik.errors.email : ""}
          required
          leftIcon={<Mail size={18} className={classes.fieldIcon} />}
          maxLength={100}
        />
        <CustomInput
          label="Password"
          type="password"
          name="password"
          placeholder="••••••••"
          value={formik.values.password}
          setValue={(val) => formik.setFieldValue("password", val)}
          error={formik.touched.password && formik.errors.password ? formik.errors.password : ""}
          required
          leftIcon={<Lock size={18} className={classes.fieldIcon} />}
          maxLength={64}
        />
        <div className={classes.forgotRow}>
          <button type="button" onClick={() => router.push("/forgot-password")} className={classes.link}>
            Forgot password?
          </button>
        </div>
        <CustomButton type="submit" loading={loading} fullWidth className={classes.submit}>
          Sign in
        </CustomButton>
      </form>

      <p className={classes.footer}>
        New to ZTDPP?{" "}
        <Link href="/register" className={classes.link}>
          Create an account
        </Link>
        {" · "}
        <Link href="/admin/login" className={classes.link}>
          Admin sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
