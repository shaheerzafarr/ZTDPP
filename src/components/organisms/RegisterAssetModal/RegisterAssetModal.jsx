"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Modal from "@/components/organisms/Modal/Modal";
import FileDropzone from "@/components/organisms/FileDropzone/FileDropzone";
import CustomButton from "@/components/atoms/CustomButton/CustomButton";
import CustomInput from "@/components/atoms/CustomInput/CustomInput";
import useAxios from "@/interceptor/useAxios";
import { PROVENANCE_ACTIONS, SOURCE_TYPES } from "@/resources/constants/ztdpp";
import shared from "@/styles/shared.module.css";
import classes from "./RegisterAssetModal.module.css";

const SOURCE_OPTIONS = [...SOURCE_TYPES, { value: "edited", label: "Edited version of an existing asset" }];

const initialState = (defaultParentManifestId) => ({
  file: null,
  sourceType: defaultParentManifestId ? "edited" : "camera",
  title: "",
  softwareAgent: "",
  deviceMake: "",
  deviceModel: "",
  capturedAt: "",
  provider: "",
  model: "",
  modelVersion: "",
  parentManifestId: defaultParentManifestId ?? "",
  actions: [],
});

/** Converts a datetime-local value (local time, no zone) to an ISO-8601 string. */
const toIso = (value) => {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

/**
 * Registers content from the dashboard (POST assets/register).
 * Nested objects (capture, aiGeneration, actions) are JSON-stringified into
 * multipart fields, matching the backend DTO transform.
 */
export default function RegisterAssetModal({ show, setShow, onRegistered, defaultParentManifestId }) {
  const { Post } = useAxios();
  const [values, setValues] = useState(() => initialState(defaultParentManifestId));
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  // Reset the form each time the modal is opened.
  useEffect(() => {
    if (show) {
      setValues(initialState(defaultParentManifestId));
      setError("");
      setProgress(0);
    }
  }, [show, defaultParentManifestId]);

  const set = (field) => (value) => setValues((prev) => ({ ...prev, [field]: value }));

  const toggleAction = (value) =>
    setValues((prev) => ({
      ...prev,
      actions: prev.actions.includes(value) ? prev.actions.filter((a) => a !== value) : [...prev.actions, value],
    }));

  const validate = () => {
    if (!values.file) return "Select an image to register.";
    if (values.sourceType === "ai_generated" && !values.model.trim()) return "Model name is required for AI generated content.";
    if (values.sourceType === "edited") {
      if (!values.parentManifestId.trim()) return "Parent manifest id is required for an edited version.";
      if (!values.actions.length) return "Select at least one edit action.";
    }
    if (values.capturedAt && !toIso(values.capturedAt)) return "Capture date is invalid.";
    return "";
  };

  const submit = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setLoading(true);
    setProgress(0);

    const form = new FormData();
    form.append("file", values.file);
    form.append("sourceType", values.sourceType);
    if (values.title.trim()) form.append("title", values.title.trim());
    if (values.softwareAgent.trim()) form.append("softwareAgent", values.softwareAgent.trim());

    if (values.sourceType === "camera") {
      const capture = {
        ...(values.deviceMake.trim() ? { deviceMake: values.deviceMake.trim() } : {}),
        ...(values.deviceModel.trim() ? { deviceModel: values.deviceModel.trim() } : {}),
        ...(values.softwareAgent.trim() ? { software: values.softwareAgent.trim() } : {}),
        ...(values.capturedAt ? { capturedAt: toIso(values.capturedAt) } : {}),
      };
      if (Object.keys(capture).length) form.append("capture", JSON.stringify(capture));
    }

    if (values.sourceType === "ai_generated") {
      form.append(
        "aiGeneration",
        JSON.stringify({
          ...(values.provider.trim() ? { provider: values.provider.trim() } : {}),
          model: values.model.trim(),
          ...(values.modelVersion.trim() ? { modelVersion: values.modelVersion.trim() } : {}),
        }),
      );
    }

    if (values.sourceType === "edited") {
      form.append("parentManifestId", values.parentManifestId.trim());
      form.append(
        "actions",
        JSON.stringify(
          values.actions.map((action) => ({
            action,
            ...(values.softwareAgent.trim() ? { softwareAgent: values.softwareAgent.trim() } : {}),
          })),
        ),
      );
    }

    const { response } = await Post({
      route: "assets/register",
      data: form,
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
      onUploadProgress: (e) => {
        if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
      },
    });
    setLoading(false);

    if (response?.data) {
      const data = response.data;
      if (data.alreadyRegistered) {
        toast.info("Already registered", {
          description: "This exact content hash is already anchored under your account.",
        });
      } else {
        toast.success(
          `Registered ${data.manifest?.manifestId ? `v${data.manifest.version ?? 1}` : "content"} · ledger entry ${
            data.manifest?.ledger?.seq ? `#${data.manifest.ledger.seq}` : "pending"
          }`,
        );
      }
      setShow(false);
      onRegistered?.(data);
    }
  };

  const isCamera = values.sourceType === "camera";
  const isAi = values.sourceType === "ai_generated";
  const isEdited = values.sourceType === "edited";

  return (
    <Modal show={show} setShow={setShow} title={isEdited ? "Register an edited version" : "Register content"} size="large">
      <div className={classes.body}>
        <FileDropzone
          file={values.file}
          onChange={set("file")}
          disabled={loading}
          hint="The file is fingerprinted (SHA-256 + perceptual hash) and signed. It is not stored."
        />

        <div className={shared.formGrid}>
          <div className={classes.field}>
            <label className={shared.fieldLabel} htmlFor="register-source-type">
              Source type<span className={classes.required}>*</span>
            </label>
            <select
              id="register-source-type"
              className={classes.select}
              value={values.sourceType}
              onChange={(e) => set("sourceType")(e.target.value)}
              disabled={loading}
            >
              {SOURCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <CustomInput
            label="Title"
            value={values.title}
            setValue={set("title")}
            placeholder="Sunset over the harbour"
            maxLength={200}
            disabled={loading}
          />
          <CustomInput
            label={isEdited ? "Editing software" : "Software agent"}
            value={values.softwareAgent}
            setValue={set("softwareAgent")}
            placeholder={isEdited ? "Photoshop 26.0" : isAi ? "Studio pipeline 2.1" : "CameraApp 3.2.0"}
            maxLength={120}
            disabled={loading}
          />
        </div>

        {isCamera && (
          <fieldset className={classes.group}>
            <legend className={classes.groupTitle}>Capture details</legend>
            <div className={shared.formGrid}>
              <CustomInput
                label="Device make"
                value={values.deviceMake}
                setValue={set("deviceMake")}
                placeholder="Apple"
                maxLength={100}
                disabled={loading}
              />
              <CustomInput
                label="Device model"
                value={values.deviceModel}
                setValue={set("deviceModel")}
                placeholder="iPhone 15 Pro"
                maxLength={100}
                disabled={loading}
              />
              <div className={classes.field}>
                <label className={shared.fieldLabel} htmlFor="register-captured-at">
                  Captured at
                </label>
                <input
                  id="register-captured-at"
                  type="datetime-local"
                  className={classes.nativeInput}
                  value={values.capturedAt}
                  onChange={(e) => set("capturedAt")(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </fieldset>
        )}

        {isAi && (
          <fieldset className={classes.group}>
            <legend className={classes.groupTitle}>AI generation</legend>
            <div className={shared.formGrid}>
              <CustomInput
                label="Provider"
                value={values.provider}
                setValue={set("provider")}
                placeholder="OpenAI"
                maxLength={100}
                disabled={loading}
              />
              <CustomInput
                label="Model"
                value={values.model}
                setValue={set("model")}
                placeholder="gpt-image-1"
                maxLength={120}
                required
                disabled={loading}
              />
              <CustomInput
                label="Model version"
                value={values.modelVersion}
                setValue={set("modelVersion")}
                placeholder="2026-05"
                maxLength={60}
                disabled={loading}
              />
            </div>
          </fieldset>
        )}

        {isEdited && (
          <fieldset className={classes.group}>
            <legend className={classes.groupTitle}>Lineage</legend>
            <CustomInput
              label="Parent manifest id"
              value={values.parentManifestId}
              setValue={set("parentManifestId")}
              placeholder="urn:ztdpp:manifest:…"
              maxLength={80}
              required
              disabled={loading || Boolean(defaultParentManifestId)}
            />
            <div className={classes.actionsBlock}>
              <span className={shared.fieldLabel}>
                Edit actions<span className={classes.required}>*</span>
              </span>
              <div className={classes.actionsGrid}>
                {PROVENANCE_ACTIONS.map((a) => (
                  <label key={a.value} className={shared.checkItem}>
                    <input
                      type="checkbox"
                      checked={values.actions.includes(a.value)}
                      onChange={() => toggleAction(a.value)}
                      disabled={loading}
                    />
                    <span>
                      <span className={shared.checkTitle}>{a.label}</span>
                      <br />
                      <span className={shared.checkDesc}>
                        <code>{a.value}</code>
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </fieldset>
        )}

        {error && <p className={classes.error}>{error}</p>}

        <div className={shared.formActions}>
          <CustomButton variant="outline" onClick={() => setShow(false)} disabled={loading}>
            Cancel
          </CustomButton>
          <CustomButton onClick={submit} loading={loading} disabled={!values.file}>
            {loading ? (progress < 100 ? `Uploading ${progress}%` : "Signing…") : isEdited ? "Register edit" : "Register"}
          </CustomButton>
        </div>
      </div>
    </Modal>
  );
}
