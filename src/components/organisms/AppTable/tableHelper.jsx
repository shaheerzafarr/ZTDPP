"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, parseISO } from "date-fns";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import classes from "./tableHelper.module.css";

export const getFormattedPrice = ({ price, currency = "$", toFixed = 2 }) => {
  return `${currency}${parseFloat(price).toFixed(toFixed)}`;
};

const roleBadgeColors = {
  "Business Owner": classes.roleBusinessOwner,
};

const statusStyles = {
  active: classes.statusActive,
  inactive: classes.statusInactive,
  pending: classes.statusPending,
  overdue: classes.statusOverdue,
  paid: classes.statusPaid,
  trial: classes.statusTrial,
  suspended: classes.statusSuspended,
  refunded: classes.statusRefunded,
  scheduled: classes.statusScheduled,
  "in-progress": classes.statusInProgress,
  completed: classes.statusCompleted,
  cancelled: classes.statusCancelled,
  approved: classes.statusApproved,
  rejected: classes.statusRejected,
  open: classes.statusOpen,
  resolved: classes.statusResolved,
  irrelevant: classes.statusIrrelevant,
  recurring: classes.statusRecurring,
  "one-time": classes.statusOneTime,
};

const subscriptionColors = {
  Premium: classes.subscriptionPremium,
  Standard: classes.subscriptionStandard,
  Enterprise: classes.subscriptionEnterprise,
};

export function RenderUserPhotoCell({ photo, name = "", email = "" }) {
  return (
    <div className={classes.userCell}>
      <Avatar className={classes.userAvatar}>
        <AvatarImage src={photo} />
        <AvatarFallback className={classes.userAvatarFallback}>{name?.[0]}</AvatarFallback>
      </Avatar>
      <div>
        <p className={classes.userName}>{name}</p>
        <p className={classes.userEmail}>{email}</p>
      </div>
    </div>
  );
}

export const RenderGeneralTextCell = ({ text, fontType = "medium", color = classes.colorForeground }) => {
  const fontClass = { light: classes.fontLight, regular: classes.fontRegular, medium: classes.fontMedium, bold: classes.fontBold };
  return <span className={cn(classes.generalText, fontClass[fontType], color)}>{text}</span>;
};

export function RenderUserRoleCell({ role }) {
  const colors = roleBadgeColors[role] || classes.roleDefault;
  return <span className={cn(classes.roleBadge, colors)}>{role}</span>;
}

export const RenderStatusCell = ({ status }) => {
  const normalizedStatus = status?.toLowerCase().replace(/\s+/g, "-");
  return (
    <span className={cn(classes.statusBadge, statusStyles[normalizedStatus] || classes.statusDefault)}>
      {status}
    </span>
  );
};

export const RenderDateCell = ({ date }) => {
  const formatted = (() => {
    try {
      const d = typeof date === "string" && date.includes("T") ? parseISO(date) : new Date(date);
      return format(d, "MMM, dd yyyy");
    } catch { return date; }
  })();
  return <div className={classes.dateCell}><p>{formatted}</p></div>;
};

export const RenderPriceCell = ({ price }) => {
  const numericPrice = Number(price);
  const formatted = getFormattedPrice({ price });
  return <span className={numericPrice <= 0 ? classes.priceNegative : classes.priceDefault}>{formatted}</span>;
};

export const RenderSubscriptionCell = ({ subscription }) => {
  return <span className={cn(classes.subscription, subscriptionColors[subscription] || classes.subscriptionDefault)}>{subscription}</span>;
};

export const RenderRatingCell = ({ rating }) => {
  return (
    <span className={classes.rating}>
      <Star className={classes.ratingIcon} fill="currentColor" />
      {rating.toFixed(1)}
    </span>
  );
};
