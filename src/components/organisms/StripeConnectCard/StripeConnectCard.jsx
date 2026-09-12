"use client";
import CustomButton from "@/components/atoms/CustomButton/CustomButton";
import Spinner from "@/components/atoms/Spinner/Spinner";
import AreYouSure from "@/components/organisms/AreYouSure/AreYouSure";
import useAxios from "@/interceptor/useAxios";
import { updateUserData } from "@/store/auth/authSlice";
import { CheckCircle2, Plus } from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import classes from "./StripeConnectCard.module.css";

const formatWarnings = (warnings) =>
  Array.isArray(warnings) ? warnings.filter(Boolean).map((warning) => `• ${String(warning)}`).join("\n") : "";

export default function StripeConnectCard() {
  const { Get, Delete } = useAxios();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.authReducer);
  const isStripeConnected = user?.stripeAccountStatus === "onboarding_complete";
  const [isLoading, setIsLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const refreshProfile = async () => {
    const { response } = await Get({ route: "users/me", showAlert: false });
    const data = response?.data;
    if (data) dispatch(updateUserData(data));
  };

  const handleStripeConnect = async () => {
    setIsLoading(true);
    const { response } = await Get({ route: "users/stripe/connect" });
    if (response) {
      const data = response?.data;
      const _isConnected = data?.user?.stripeAccountStatus === "onboarding_complete";
      if (data?.onboardingUrl) { window.open(data.onboardingUrl, "_self"); return; }
      if (_isConnected) { dispatch(updateUserData(data)); toast.success("Your Stripe account is connected successfully"); }
    }
    setIsLoading(false);
  };

  const handleDisconnectClick = async () => {
    if (isLoading || disconnecting) return;
    setDisconnecting(true);
    const { response } = await Get({ route: "users/stripe/disconnect-check", showAlert: false });
    setDisconnecting(false);
    if (!response) { toast.error("Unable to validate Stripe dependencies."); return; }
    const audit = response?.data;
    if (!audit?.canDisconnect) {
      const warnings = formatWarnings(audit?.warnings);
      toast.error(warnings ? `Stripe can't be disconnected yet. Resolve these first:\n${warnings}` : "Stripe can't be disconnected yet.");
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmDisconnect = async () => {
    setShowConfirm(false);
    setDisconnecting(true);
    const { response } = await Delete({ route: "users/stripe/disconnect" });
    if (response) { await refreshProfile(); toast.success("Stripe disconnected. You can now connect another account."); }
    setDisconnecting(false);
  };

  return (
    <div className={classes.wrapper}>
      <h3 className={classes.title}>Stripe Connect</h3>
      <div className={classes.body}>
        <h4 className={classes.heading}>{isStripeConnected ? "Your Stripe Account is Connected" : "Connect Your Stripe Account"}</h4>
        <p className={classes.description}>
          {isStripeConnected ? "Your Stripe account is connected successfully. You can now receive payouts from your customers." : "Connect your Stripe account to start receiving payouts. Stripe provides secure and fast payment processing with support for multiple payment methods."}
        </p>
        {isStripeConnected ? (
          <div className={classes.connectedGroup}>
            <span className={classes.connectedBadge}><CheckCircle2 size={16} /> Connected</span>
            <CustomButton variant="outline" onClick={() => void handleDisconnectClick()} disabled={disconnecting} className={classes.disconnectButton}>
              {disconnecting ? "Disconnecting..." : "Disconnect Stripe"}
            </CustomButton>
          </div>
        ) : (
          <CustomButton variant="primary" onClick={() => void handleStripeConnect()} disabled={isLoading}>
            <Plus size={16} /> Connect With Stripe
          </CustomButton>
        )}
      </div>
      {(isLoading || disconnecting) && (
        <div className={classes.overlay}><Spinner /></div>
      )}
      <AreYouSure show={showConfirm} setShow={setShowConfirm} text="Disconnect Stripe?" message="You can connect another Stripe account afterwards. Payments that require Stripe Connect will be unavailable until you reconnect." buttonText="Disconnect" loading={disconnecting} handleConfirm={() => void handleConfirmDisconnect()} />
    </div>
  );
}
