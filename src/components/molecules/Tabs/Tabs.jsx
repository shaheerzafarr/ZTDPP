"use client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import classes from "./Tabs.module.css";

export default function Tabs({
  tabs = [], activeTab, onTabChange, variant = "outlined", size = "medium",
  fullWidth = false, centered = false, className = "", disabled = false, animated = true, orientation = "horizontal",
}) {
  const [internalActiveTab, setInternalActiveTab] = useState(activeTab || tabs[0]?.value);

  useEffect(() => { if (activeTab !== undefined) setInternalActiveTab(activeTab); }, [activeTab]);

  const handleTabClick = (tabValue, tabDisabled) => {
    if (disabled || tabDisabled) return;
    setInternalActiveTab(tabValue);
    onTabChange?.(tabValue);
  };

  if (!tabs.length) return null;

  return (
    <div
      data-orientation={orientation}
      className={cn(
        classes.root,
        fullWidth && classes.fullWidth,
        centered && classes.centered,
        disabled && classes.rootDisabled,
        className,
      )}
    >
      <div
        role="tablist"
        data-variant={variant}
        data-orientation={orientation}
        className={classes.list}
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleTabClick(tab.value, tab.disabled)}
            role="tab"
            aria-selected={tab.value === internalActiveTab}
            aria-disabled={disabled || tab.disabled}
            tabIndex={tab.value === internalActiveTab ? 0 : -1}
            disabled={disabled || tab.disabled}
            data-variant={variant}
            data-size={size}
            data-active={tab.value === internalActiveTab}
            className={cn(
              classes.tab,
              animated && classes.animated,
              (disabled || tab.disabled) && classes.tabDisabled,
            )}
          >
            {tab.icon && <span className={classes.icon}>{tab.icon}</span>}
            {tab.label}
            {tab.badge && <span className={classes.badge}>{tab.badge}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
