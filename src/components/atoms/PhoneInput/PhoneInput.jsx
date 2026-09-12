"use client";
import { useState, useId } from "react";
import { isValidPhoneNumber, parsePhoneNumberFromString } from "libphonenumber-js";
import ReactPhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/bootstrap.css";
import { cn } from "@/lib/utils";
import classes from "./PhoneInput.module.css";

export default function PhoneInput({
  label = "", value = "", setValue = () => {}, error = "", className = "",
  defaultCountry = "ae", showDropdown = false, required = false, disabled = false, ...props
}) {
  const [internalError, setInternalError] = useState("");
  const inputId = useId();
  const showError = error || internalError;

  const getPhoneValue = () => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object" && value !== null && "phoneNumber" in value) {
      const callingCode = value.callingCode || "";
      const phoneNumber = value.phoneNumber || "";
      return callingCode && phoneNumber ? `+${callingCode}${phoneNumber}` : "";
    }
    return "";
  };

  const handlePhoneChange = (phone) => {
    const phoneString = typeof phone === "string" ? phone : String(phone || "");
    const phoneNumberObj = parsePhoneNumberFromString(`+${phoneString}`);
    if (phoneNumberObj?.country) {
      const isValid = isValidPhoneNumber(phoneNumberObj.nationalNumber, phoneNumberObj.country);
      setValue({ callingCode: phoneNumberObj.countryCallingCode, phoneNumber: phoneNumberObj.nationalNumber, isValid });
      setInternalError(isValid ? "" : "Invalid phone number");
    } else {
      setInternalError("");
      if (phoneString) {
        const match = /^(\d{1,4})(.+)$/.exec(phoneString);
        if (match) setValue({ callingCode: match[1], phoneNumber: match[2], isValid: false });
      }
    }
  };

  return (
    <div className={cn(classes.container, disabled && classes.disabled, className)}>
      {label && (
        <label htmlFor={inputId} className={classes.label}>
          {label}{required && <span className={classes.required}>*</span>}
        </label>
      )}
      <div className={classes.inputWrapper}>
        <ReactPhoneInput country={defaultCountry} value={getPhoneValue()} onChange={handlePhoneChange}
          disabled={disabled} specialLabel="" countryCodeEditable={false} enableSearch={showDropdown} {...props} />
      </div>
      {showError && <p className={classes.errorText}>*{showError}</p>}
    </div>
  );
}
