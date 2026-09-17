"use client";

import CustomButton from "@/components/atoms/CustomButton/CustomButton";
import AuthLayout from "@/components/layout/AuthLayout";
import useAxios from "@/interceptor/useAxios";
import { setUserRoleCookie } from "@/resources/utils/cookie";
import { getRoleName } from "@/resources/utils/helper";
import { saveLoginUserData, setResetCode } from "@/store/auth/authSlice";
import { useEffect, useState } from "react";
import { OtpInput } from "reactjs-otp-input";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import classes from "./page.module.css";

const otpInputStyle = {
  width: "3rem",
  height: "3rem",
  minWidth: "3rem",
  boxSizing: "border-box",
  fontSize: "1.125rem",
  fontWeight: 600,
  textAlign: "center",
  fontFamily: "inherit",
  borderRadius: "var(--radius)",
  border: "1px solid hsl(var(--input))",
  backgroundColor: "hsl(var(--background))",
  color: "hsl(var(--foreground))",
  outline: "none",
};

const otpFocusStyle = {
  borderColor: "hsl(var(--ring))",
  boxShadow: "0 0 0 3px hsl(var(--ring) / 0.25)",
};

const RESEND_SECONDS = 120;

/**
 * Two flows share this screen (redux `verifyOtpType`):
 *  - signUp:         POST auth/verify-email  -> session
 *  - forgotPassword: POST auth/validate-otp  -> /reset-password
 */
export default function VerifyOtpPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { Post, Patch } = useAxios();
  const { resetEmail, verifyOtpType } = useSelector((state) => state.authReducer);
  const email = resetEmail || "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState({ verify: false, resend: false });
  const [timeLeft, setTimeLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (!email) router.replace("/login");
  }, [email, router]);

  useEffect(() => {
    if (timeLeft <= 0) return undefined;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  const maskedEmail = email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + "*".repeat(b.length) + c);

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setLoading((l) => ({ ...l, verify: true }));

    if (verifyOtpType === "forgotPassword") {
      const { response } = await Post({
        route: "auth/validate-otp",
        data: { email, code: otp, type: "email" },
      });
      setLoading((l) => ({ ...l, verify: false }));
      if (!response) return;
      dispatch(setResetCode(response.data.resetToken));
      router.push("/reset-password");
      return;
    }

    const { response } = await Post({
      route: "auth/verify-email",
      data: { email, code: otp, type: "email" },
    });
    setLoading((l) => ({ ...l, verify: false }));
    if (!response?.data) return;
    const user = response.data.user;
    setUserRoleCookie(getRoleName(user));
    dispatch(saveLoginUserData({ user, accessToken: response.data.token ?? null }));
    toast.success("Email verified. Welcome to ZTDPP!");
    router.push("/dashboard");
  };

  const handleResend = async () => {
    setLoading((l) => ({ ...l, resend: true }));
    const { response } = await Patch({
      route: "auth/resend-otp",
      data: { email, type: "email", purpose: verifyOtpType === "forgotPassword" ? "recover-password" : "verify-email" },
    });
    setLoading((l) => ({ ...l, resend: false }));
    if (response) {
      toast.success("A new code has been sent");
      setTimeLeft(RESEND_SECONDS);
      setOtp("");
    }
  };

  return (
    <AuthLayout>
      <div className={classes.header}>
        <h1 className={classes.title}>
          {verifyOtpType === "forgotPassword" ? "Enter reset code" : "Verify your email"}
        </h1>
        <p className={classes.subtitle}>We sent a 6-digit code to {maskedEmail}.</p>
      </div>

      <form onSubmit={handleVerify} className={classes.form}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <OtpInput
            value={otp}
            onChange={setOtp}
            numInputs={6}
            isInputNum
            shouldAutoFocus
            inputStyle={otpInputStyle}
            focusStyle={otpFocusStyle}
            separator={<span style={{ width: 8 }} />}
          />
        </div>

        <CustomButton type="submit" loading={loading.verify} fullWidth className={classes.submit}>
          {verifyOtpType === "forgotPassword" ? "Continue" : "Verify"}
        </CustomButton>

        <p className={classes.footer}>
          {timeLeft > 0 ? (
            <>Resend available in {timeLeft}s</>
          ) : (
            <button type="button" className={classes.link} onClick={handleResend} disabled={loading.resend}>
              {loading.resend ? "Sending…" : "Resend code"}
            </button>
          )}
        </p>
      </form>
    </AuthLayout>
  );
}
