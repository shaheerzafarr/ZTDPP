"use client";

import CustomButton from "@/components/atoms/CustomButton/CustomButton";
import CustomInput from "@/components/atoms/CustomInput/CustomInput";
import AuthLayout from "@/components/layout/AuthLayout";
import useAxios from "@/interceptor/useAxios";
import { zodValidate } from "@/lib/zodValidate";
import { ROLE_SUPER_ADMIN } from "@/resources/constants/ztdpp";
import { setUserRoleCookie } from "@/resources/utils/cookie";
import { getRoleName } from "@/resources/utils/helper";
import { saveLoginUserData } from "@/store/auth/authSlice";
import { useFormik } from "formik";
import { Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { z } from "zod";
import classes from "./page.module.css";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export default function AdminLoginPage() {
  const router = useRouter();
  const { Post } = useAxios();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useSelector((state) => state.authReducer);

  useEffect(() => {
    if (isAuthenticated)
      router.replace(getRoleName(user) === ROLE_SUPER_ADMIN ? "/admin/dashboard" : "/dashboard");
  }, [isAuthenticated, user, router]);

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validate: zodValidate(schema),
    onSubmit: async (values) => {
      setLoading(true);
      const { response } = await Post({ route: "auth/admin/login", data: values });
      setLoading(false);
      if (!response?.data) return;
      const admin = response.data;
      setUserRoleCookie(getRoleName(admin));
      dispatch(saveLoginUserData({ user: admin }));
      toast.success("Signed in to the admin console");
      router.push("/admin/dashboard");
    },
  });

  return (
    <AuthLayout badge="Admin">
      <div className={classes.header}>
        <h1 className={classes.title}>Security operations console</h1>
        <p className={classes.subtitle}>Restricted access for platform administrators.</p>
      </div>

      <form onSubmit={formik.handleSubmit} className={classes.form}>
        <CustomInput
          label="Email"
          type="email"
          name="email"
          placeholder="admin@ztdpp.io"
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
        <CustomButton type="submit" loading={loading} fullWidth className={classes.submit}>
          Sign in
        </CustomButton>
      </form>

      <p className={classes.footer}>
        <Link href="/login" className={classes.link}>
          Back to user sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
