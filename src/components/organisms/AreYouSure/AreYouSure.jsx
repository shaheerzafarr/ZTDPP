"use client";
import { AlertTriangle } from "lucide-react";
import Modal from "@/components/organisms/Modal/Modal";
import CustomButton from "@/components/atoms/CustomButton/CustomButton";
import classes from "./AreYouSure.module.css";

export default function AreYouSure({
  show, setShow,
  message = "This action cannot be undone. Please confirm if you'd like to continue.",
  text = "Are you sure?", buttonText = "Confirm", handleConfirm, loading = false,
}) {
  return (
    <Modal show={show} setShow={setShow} size="small" showHeader={false}>
      <div className={classes.wrapper}>
        <AlertTriangle size={72} className={classes.icon} />
        <div className={classes.textBlock}>
          <h5 className={classes.heading}>{text}</h5>
          <p className={classes.message}>{message}</p>
        </div>
        <div className={classes.actions}>
          <CustomButton variant="outline" onClick={() => setShow(false)} className={classes.actionButton}>Cancel</CustomButton>
          <CustomButton onClick={handleConfirm} loading={loading} disabled={loading} className={classes.actionButton}>{buttonText}</CustomButton>
        </div>
      </div>
    </Modal>
  );
}
