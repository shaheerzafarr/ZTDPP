"use client";

import CustomButton from "@/components/atoms/CustomButton/CustomButton";
import AuthLayout from "@/components/layout/AuthLayout";
import useAxios from "@/interceptor/useAxios";
import { setUserRoleCookie } from "@/resources/utils/cookie";
import { getRoleName } from "@/resources/utils/helper";
import { saveLoginUserData, setResetCode } from "@/store/auth/authSlice";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import classes from "./page.module.css";

const RESEND_SECONDS = 120;
const OTP_LENGTH = 6;

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
  const [otpDigits, setOtpDigits] = useState(() =>
    Array(OTP_LENGTH).fill(""),
  );
  const otpRefs = useRef([]);
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
  const otp = otpDigits.join("");

  const applyDigits = (startIndex, value) => {
    const incoming = value.replace(/\D/g, "");
    if (!incoming) return;
    setOtpDigits((current) => {
      const next = [...current];
      incoming
        .slice(0, OTP_LENGTH - startIndex)
        .split("")
        .forEach((digit, offset) => {
          next[startIndex + offset] = digit;
        });
      return next;
    });
    const nextIndex = Math.min(startIndex + incoming.length, OTP_LENGTH - 1);
    otpRefs.current[nextIndex]?.focus();
  };

  const handleDigitChange = (index, value) => {
    if (value.length > 1) {
      applyDigits(index, value);
      return;
    }
    const digit = value.replace(/\D/g, "");
    setOtpDigits((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index, event) => {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      event.preventDefault();
      setOtpDigits((current) => {
        const next = [...current];
        next[index - 1] = "";
        return next;
      });
      otpRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      otpRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    applyDigits(0, event.clipboardData.getData("text"));
  };

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
      setOtpDigits(Array(OTP_LENGTH).fill(""));
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
        <div
          className={classes.otpGroup}
          role="group"
          aria-label="Six-digit verification code"
          onPaste={handlePaste}
        >
          {otpDigits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                otpRefs.current[index] = element;
              }}
              className={classes.otpInput}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              aria-label={`Verification code digit ${index + 1}`}
              maxLength={1}
              value={digit}
              autoFocus={index === 0}
              onChange={(event) => handleDigitChange(index, event.target.value)}
              onKeyDown={(event) => handleDigitKeyDown(index, event)}
            />
          ))}
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
