"use client";
import { Crown, Star } from "lucide-react";
import classes from "./TechnicianCard.module.css";

function initials(firstName = "", lastName = "") {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function TechnicianCard({ technician, highlight }) {
  return (
    <div className={classes.root}>
      <div className={classes.avatarWrapper}>
        <div className={classes.avatar}>
          {initials(technician?.firstName, technician?.lastName)}
        </div>
        {highlight && <Crown size={12} className={classes.crown} aria-hidden />}
      </div>
      <div className={classes.info}>
        <p className={classes.name}>
          {technician?.firstName} {technician?.lastName}
        </p>
        <p className={classes.jobs}>
          {technician?.completedJobsCount ?? technician?.jobsCompleted ?? 0} jobs
        </p>
      </div>
      <span className={classes.rating}>
        <Star size={12} fill="currentColor" aria-hidden />
        {(technician?.ratingAverage ?? technician?.rating ?? 0).toFixed(1)}
      </span>
    </div>
  );
}

export default TechnicianCard;
