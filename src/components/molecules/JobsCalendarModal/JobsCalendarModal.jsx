"use client";
import Modal from "@/components/organisms/Modal/Modal";
import classes from "./JobsCalendarModal.module.css";

export default function JobsCalendarModal({ show, setShow }) {
  return (
    <Modal show={show} setShow={setShow} title="Jobs Calendar" size="large">
      <div className={classes.placeholder}>
        <p className={classes.text}>Calendar view coming soon.</p>
      </div>
    </Modal>
  );
}
