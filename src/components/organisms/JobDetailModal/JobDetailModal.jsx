"use client";
import Modal from "@/components/organisms/Modal/Modal";
import { formatJobStatus } from "@/resources/utils/helper";
import { format, parseISO } from "date-fns";
import classes from "./JobDetailModal.module.css";

export default function JobDetailModal({ show, setShow, job }) {
  if (!job) return null;
  const customer = job.customer ? `${job.customer.firstName} ${job.customer.lastName}` : "—";
  const technician = job.technician ? `${job.technician.firstName} ${job.technician.lastName}` : "—";
  const services = job.services?.map((s) => s.name).join(", ") || "—";
  const startDate = job.startDate ? (() => { try { return format(parseISO(job.startDate), "MMM dd, yyyy"); } catch { return job.startDate; } })() : "—";

  return (
    <Modal show={show} setShow={setShow} title="Job Details" size="medium">
      <div className={classes.wrapper}>
        <div className={classes.grid}>
          <div><p className={classes.label}>Client</p><p className={classes.value}>{customer}</p></div>
          <div><p className={classes.label}>Technician</p><p className={classes.value}>{technician}</p></div>
          <div><p className={classes.label}>Services</p><p className={classes.value}>{services}</p></div>
          <div><p className={classes.label}>Status</p><p className={classes.value}>{formatJobStatus(job.status)}</p></div>
          <div><p className={classes.label}>Scheduled Date</p><p className={classes.value}>{startDate}</p></div>
          <div><p className={classes.label}>Type</p><p className={classes.value}>{job.paymentType || "—"}</p></div>
          {job.totalAmount !== undefined && (
            <div><p className={classes.label}>Amount</p><p className={classes.value}>${job.totalAmount.toFixed(2)}</p></div>
          )}
          {job.notes && (
            <div className={classes.fullWidth}><p className={classes.label}>Notes</p><p className={classes.value}>{job.notes}</p></div>
          )}
        </div>
      </div>
    </Modal>
  );
}
