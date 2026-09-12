import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import classes from "./calendar.module.css";

function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(classes.calendar, className)}
      classNames={{
        months: classes.months,
        month: classes.month,
        caption: classes.caption,
        caption_label: classes.captionLabel,
        nav: classes.nav,
        nav_button: cn(buttonVariants({ variant: "outline" }), classes.navButton),
        nav_button_previous: classes.navButtonPrevious,
        nav_button_next: classes.navButtonNext,
        table: classes.table,
        head_row: classes.headRow,
        head_cell: classes.headCell,
        row: classes.row,
        cell: classes.cell,
        day: cn(buttonVariants({ variant: "ghost" }), classes.day),
        day_range_end: classes.dayRangeEnd,
        day_selected: classes.daySelected,
        day_today: classes.dayToday,
        day_outside: classes.dayOutside,
        day_disabled: classes.dayDisabled,
        day_range_middle: classes.dayRangeMiddle,
        day_hidden: classes.dayHidden,
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className={classes.icon} />,
        IconRight: ({ ..._props }) => <ChevronRight className={classes.icon} />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
