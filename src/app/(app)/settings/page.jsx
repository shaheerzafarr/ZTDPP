"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import { z } from "zod";
import { toast } from "sonner";
import { Building2, Lock, Phone, ShieldCheck, User, UserCircle2 } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader/PageHeader";
import SectionCard from "@/components/molecules/SectionCard/SectionCard";
import KeyValueList from "@/components/molecules/KeyValueList/KeyValueList";
import CustomButton from "@/components/atoms/CustomButton/CustomButton";
import CustomInput from "@/components/atoms/CustomInput/CustomInput";
import { StatusBadge } from "@/components/molecules/ToneBadge/ToneBadge";
import useAxios from "@/interceptor/useAxios";
import { zodValidate } from "@/lib/zodValidate";
import { logout, updateUserData } from "@/store/auth/authSlice";
import { formatDate, getRoleName, titleCase } from "@/resources/utils/helper";
import shared from "@/styles/shared.module.css";
import classes from "./page.module.css";

const SECTIONS = [
  { value: "profile", label: "Profile", icon: UserCircle2, description: "Name and organisation details." },
  { value: "security", label: "Security", icon: ShieldCheck, description: "Password and account status." },
];

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60, "At most 60 characters"),
  lastName: z.string().trim().min(1, "Last name is required").max(60, "At most 60 characters"),
});

const passwordRules = z
  .string()
  .min(8, "At least 8 characters")
  .max(30, "At most 30 characters")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/\d/, "Include a number");

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordRules,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "New password must differ from the current one",
    path: ["newPassword"],
  });

export default function SettingsPage() {
  const dispatch = useDispatch();
  const { Get } = useAxios();
  const { user } = useSelector((state) => state.authReducer);
  const [section, setSection] = useState("profile");

  // Refresh the profile in the background so the form reflects server state.
  useEffect(() => {
    const refresh = async () => {
      const { response } = await Get({ route: "users/me", showAlert: false });
      if (response?.data) dispatch(updateUserData(response.data));
    };
    void refresh();
  }, []);

  return (
    <div className={shared.stack}>
      <PageHeader title="Settings" subtitle="Manage your profile and the security of your ZTDPP account." />

      <div className={classes.layout}>
        <nav className={classes.nav} aria-label="Settings sections">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = section === s.value;
            return (
              <button
                key={s.value}
                type="button"
                className={classes.navItem}
                data-active={active}
                onClick={() => setSection(s.value)}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={18} className={classes.navIcon} />
                <span>
                  <span className={classes.navLabel}>{s.label}</span>
                  <span className={classes.navDesc}>{s.description}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className={classes.panel}>
          {section === "profile" && <ProfileSection user={user} />}
          {section === "security" && <SecuritySection user={user} />}
        </div>
      </div>
    </div>
  );
}

function ProfileSection({ user }) {
  const dispatch = useDispatch();
  const { Patch } = useAxios();
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
    },
    validate: zodValidate(profileSchema),
    onSubmit: async (values) => {
      setLoading(true);
      const { response } = await Patch({
        route: "users/update-me",
        data: { firstName: values.firstName.trim(), lastName: values.lastName.trim() },
      });
      setLoading(false);
      if (!response) return;
      dispatch(updateUserData(response.data ?? values));
      toast.success("Profile updated");
    },
  });

  const err = (f) => (formik.touched[f] && formik.errors[f] ? formik.errors[f] : "");

  return (
    <SectionCard title="Profile" description="How you appear in reports and audit trails.">
      <form onSubmit={formik.handleSubmit} className={classes.form}>
        <div className={shared.formGrid}>
          <CustomInput
            label="First name"
            name="firstName"
            value={formik.values.firstName}
            setValue={(v) => formik.setFieldValue("firstName", v)}
            error={err("firstName")}
            required
            maxLength={60}
            leftIcon={<User size={18} />}
          />
          <CustomInput
            label="Last name"
            name="lastName"
            value={formik.values.lastName}
            setValue={(v) => formik.setFieldValue("lastName", v)}
            error={err("lastName")}
            required
            maxLength={60}
          />
          <CustomInput
            label="Organisation / platform"
            value={user?.company ?? ""}
            disabled
            maxLength={120}
            leftIcon={<Building2 size={18} />}
          />
          <CustomInput label="Phone" value={user?.phone ?? ""} disabled maxLength={40} leftIcon={<Phone size={18} />} />
        </div>
        <p className={classes.hint}>
          Organisation and phone are set at sign-up and shown as the claim generator on manifests you register. Contact
          support to change them.
        </p>
        <div className={shared.formActions}>
          <CustomButton
            type="button"
            variant="outline"
            onClick={() => formik.resetForm()}
            disabled={!formik.dirty || loading}
          >
            Reset
          </CustomButton>
          <CustomButton type="submit" loading={loading} disabled={!formik.dirty}>
            Save changes
          </CustomButton>
        </div>
      </form>
    </SectionCard>
  );
}

function SecuritySection({ user }) {
  const dispatch = useDispatch();
  const { Patch, Post } = useAxios();
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    validate: zodValidate(passwordSchema),
    onSubmit: async (values, helpers) => {
      setLoading(true);
      const { response } = await Patch({ route: "auth/update-password", data: values });
      setLoading(false);
      if (!response) return;
      toast.success(response.data?.message ?? "Password updated");
      helpers.resetForm();
      await Post({ route: "auth/logout", showAlert: false });
      dispatch(logout());
      window.location.assign(getRoleName(user) === "super-admin" ? "/admin/login" : "/login");
    },
  });

  const err = (f) => (formik.touched[f] && formik.errors[f] ? formik.errors[f] : "");
  const role = getRoleName(user);

  return (
    <div className={classes.stack}>
      <SectionCard title="Change password" description="Use at least 8 characters with uppercase, lowercase and a number.">
        <form onSubmit={formik.handleSubmit} className={classes.form}>
          <div className={classes.narrow}>
            <CustomInput
              label="Current password"
              type="password"
              name="currentPassword"
              placeholder="••••••••"
              value={formik.values.currentPassword}
              setValue={(v) => formik.setFieldValue("currentPassword", v)}
              error={err("currentPassword")}
              required
              maxLength={64}
              leftIcon={<Lock size={18} />}
            />
            <CustomInput
              label="New password"
              type="password"
              name="newPassword"
              placeholder="••••••••"
              value={formik.values.newPassword}
              setValue={(v) => formik.setFieldValue("newPassword", v)}
              error={err("newPassword")}
              required
              maxLength={64}
            />
            <CustomInput
              label="Confirm new password"
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={formik.values.confirmPassword}
              setValue={(v) => formik.setFieldValue("confirmPassword", v)}
              error={err("confirmPassword")}
              required
              maxLength={64}
              onEnterClick={formik.submitForm}
            />
          </div>
          <div className={shared.formActions}>
            <CustomButton type="submit" loading={loading} disabled={!formik.dirty}>
              Update password
            </CustomButton>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Account" description="Read-only account details.">
        <KeyValueList
          columns={2}
          dense
          items={[
            { label: "Email", value: user?.email, mono: true },
            { label: "Role", value: role ? titleCase(role) : null },
            { label: "Status", value: user?.status ? <StatusBadge status={user.status} /> : null },
            { label: "Member since", value: user?.createdAt ? formatDate(user.createdAt) : null },
          ]}
        />
      </SectionCard>
    </div>
  );
}
