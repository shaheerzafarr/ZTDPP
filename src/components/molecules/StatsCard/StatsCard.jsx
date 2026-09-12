"use client";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import classes from "./StatsCard.module.css";

export function StatsCard({ icon, label, value, trend }) {
  return (
    <div className={classes.root}>
      <div className={classes.blob} />
      <div className={classes.header}>
        <div className={classes.iconWrapper}>
          <div className={classes.icon}>{icon}</div>
        </div>
        {trend && (
          <span className={classes.trend} data-trend={trend.direction}>
            {trend.direction === "up" && <TrendingUp size={10} />}
            {trend.direction === "down" && <TrendingDown size={10} />}
            {trend.direction === "neutral" && <Minus size={10} />}
            {trend.value}
          </span>
        )}
      </div>
      <div>
        <p className={classes.value}>{value}</p>
        <p className={classes.label}>{label}</p>
      </div>
    </div>
  );
}

export default StatsCard;
