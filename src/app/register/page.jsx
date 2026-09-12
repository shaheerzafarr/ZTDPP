"use client";

import CustomButton from "@/components/atoms/CustomButton/CustomButton";
import CustomInput from "@/components/atoms/CustomInput/CustomInput";
import AuthLayout from "@/components/layout/AuthLayout";
import useAxios from "@/interceptor/useAxios";
import { zodValidate } from "@/lib/zodValidate";
import { setResetEmail, setVerifyOtpType } from "@/store/auth/authSlice";
import { useFormik } from "formik";
import { Building2, Lock, Mail, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { z } from "zod";
import classes from "./page.module.css";

const schema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    company: z.string().trim().min(1, "Organisation / platform name is required"),
    email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/\d/, "Include a number"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    terms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { Post } = useAxios();
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      firstName: "",
      lastName: "",
      company: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
    validate: zodValidate(schema),
    onSubmit: async (values) => {
      setLoading(true);
      const { terms, ...payload } = values;
      const { response } = await Post({ route: "auth/signup", data: payload });
      setLoading(false);
      if (!response) return;
      dispatch(setResetEmail(values.email));
      dispatch(setVerifyOtpType("signUp"));
      toast.success("Account created. Check your inbox for the verification code.");
      router.push("/verify-otp");
    },
  });

  const err = (f) => (formik.touched[f] && formik.errors[f] ? formik.errors[f] : "");

  return (
    <AuthLayout>
      <div className={classes.header}>
        <h1 className={classes.title}>Create your account</h1>
        <p className={classes.subtitle}>
          Register content provenance and verify images from your own platform.
        </p>
      </div>

      <form onSubmit={formik.handleSubmit} className={classes.form}>
        <div className={classes.row}>
          <CustomInput
            label="First name"
            name="firstName"
            placeholder="Ada"
            value={formik.values.firstName}
            setValue={(v) => formik.setFieldValue("firstName", v)}
            error={err("firstName")}
            required
            leftIcon={<User size={18} className={classes.fieldIcon} />}
            maxLength={60}
          />
          <CustomInput
            label="Last name"
            name="lastName"
            placeholder="Lovelace"
            value={formik.values.lastName}
            setValue={(v) => formik.setFieldValue("lastName", v)}
            error={err("lastName")}
            required
            maxLength={60}
          />
        </div>
        <CustomInput
          label="Organisation / platform"
          name="company"
          placeholder="Acme Media"
          value={formik.values.company}
          setValue={(v) => formik.setFieldValue("company", v)}
          error={err("company")}
          required
          leftIcon={<Building2 size={18} className={classes.fieldIcon} />}
          maxLength={120}
        />
        <CustomInput
          label="Work email"
          type="email"
          name="email"
          placeholder="you@company.com"
          value={formik.values.email}
          setValue={(v) => formik.setFieldValue("email", v)}
          error={err("email")}
          required
          leftIcon={<Mail size={18} className={classes.fieldIcon} />}
          maxLength={100}
        />
        <div className={classes.row}>
          <CustomInput
            label="Password"
            type="password"
            name="password"
            placeholder="••••••••"
            value={formik.values.password}
            setValue={(v) => formik.setFieldValue("password", v)}
            error={err("password")}
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
            setValue={(v) => formik.setFieldValue("confirmPassword", v)}
            error={err("confirmPassword")}
            required
            maxLength={64}
          />
        </div>

        <label className={classes.checkboxRow}>
          <input
            type="checkbox"
            checked={formik.values.terms}
            onChange={(e) => formik.setFieldValue("terms", e.target.checked)}
          />
          <span>
            I agree that content registered through my API keys is fingerprinted and anchored in the
            ZTD ledger. Original files are never stored.
          </span>
        </label>
        {err("terms") && <p className={classes.error}>{err("terms")}</p>}

        <CustomButton type="submit" loading={loading} fullWidth className={classes.submit}>
          Create account
        </CustomButton>
      </form>

      <p className={classes.footer}>
        Already registered?{" "}
        <Link href="/login" className={classes.link}>
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
