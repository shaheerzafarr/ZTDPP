"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useFormik } from "formik";
import { z } from "zod";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import AuthLayout from "@/components/layout/AuthLayout";
import CustomInput from "@/components/atoms/CustomInput/CustomInput";
import CustomButton from "@/components/atoms/CustomButton/CustomButton";
import useAxios from "@/interceptor/useAxios";
import { zodValidate } from "@/lib/zodValidate";
import { setResetEmail, setVerifyOtpType } from "@/store/auth/authSlice";
import classes from "./page.module.css";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
});

export default function ForgotPasswordPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { Post } = useAxios();
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: { email: "" },
    validate: zodValidate(schema),
    onSubmit: async (values) => {
      setLoading(true);
      const { response } = await Post({
        route: "auth/forgotPassword",
        data: { email: values.email, type: "email" },
      });
      setLoading(false);
      if (!response) return;
      dispatch(setResetEmail(values.email));
      dispatch(setVerifyOtpType("forgotPassword"));
      toast.success("Reset code sent to your email");
      router.push("/verify-otp");
    },
  });

  return (
    <AuthLayout>
      <div className={classes.header}>
        <h1 className={classes.title}>Reset your password</h1>
        <p className={classes.subtitle}>Enter your email and we will send a one-time code.</p>
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
          onEnterClick={formik.handleSubmit}
        />
        <CustomButton type="submit" loading={loading} fullWidth className={classes.submit}>
          Send reset code
        </CustomButton>
      </form>

      <p className={classes.footer}>
        <Link href="/login" className={classes.link}>
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
