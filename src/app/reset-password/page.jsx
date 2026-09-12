"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import { z } from "zod";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import AuthLayout from "@/components/layout/AuthLayout";
import CustomInput from "@/components/atoms/CustomInput/CustomInput";
import CustomButton from "@/components/atoms/CustomButton/CustomButton";
import useAxios from "@/interceptor/useAxios";
import { zodValidate } from "@/lib/zodValidate";
import { clearResetFlow } from "@/store/auth/authSlice";
import classes from "./page.module.css";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/\d/, "Include a number"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function ResetPasswordPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { Patch } = useAxios();
  const { resetEmail, resetCode } = useSelector((state) => state.authReducer);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!resetEmail || !resetCode) router.replace("/forgot-password");
  }, [resetEmail, resetCode, router]);

  const formik = useFormik({
    initialValues: { password: "", confirmPassword: "" },
    validate: zodValidate(schema),
    onSubmit: async (values) => {
      setLoading(true);
      const { response } = await Patch({
        route: "auth/resetPassword",
        data: {
          email: resetEmail,
          code: resetCode,
          type: "email",
          password: values.password,
          confirmPassword: values.confirmPassword,
        },
      });
      setLoading(false);
      if (!response) return;
      toast.success("Password updated. Sign in with your new password.");
      dispatch(clearResetFlow());
      router.push("/login");
    },
  });

  return (
    <AuthLayout>
      <div className={classes.header}>
        <h1 className={classes.title}>Choose a new password</h1>
        <p className={classes.subtitle}>Use at least 8 characters with upper, lower case and a number.</p>
      </div>

      <form onSubmit={formik.handleSubmit} className={classes.form}>
        <CustomInput
          label="New password"
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
        <CustomInput
          label="Confirm password"
          type="password"
          name="confirmPassword"
          placeholder="••••••••"
          value={formik.values.confirmPassword}
          setValue={(val) => formik.setFieldValue("confirmPassword", val)}
          error={
            formik.touched.confirmPassword && formik.errors.confirmPassword ? formik.errors.confirmPassword : ""
          }
          required
          leftIcon={<Lock size={18} className={classes.fieldIcon} />}
          maxLength={64}
        />
        <CustomButton type="submit" loading={loading} fullWidth className={classes.submit}>
          Update password
        </CustomButton>
      </form>
    </AuthLayout>
  );
}
