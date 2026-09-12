"use client";
import Modal from "@/components/organisms/Modal/Modal";
import CustomButton from "@/components/atoms/CustomButton/CustomButton";
import classes from "./AddEditAppJobModal.module.css";

export default function AddEditAppJobModal({ show, setShow, title = "Job", job, onSuccess }) {
  return (
    <Modal show={show} setShow={setShow} title={title} size="large">
      <div className={classes.placeholder}>
        <p className={classes.text}>Job form coming soon.</p>
        <div className={classes.actions}>
          <CustomButton variant="outline" onClick={() => setShow(false)}>Cancel</CustomButton>
          <CustomButton onClick={() => { onSuccess?.(); setShow(false); }}>Save</CustomButton>
        </div>
      </div>
    </Modal>
  );
}
