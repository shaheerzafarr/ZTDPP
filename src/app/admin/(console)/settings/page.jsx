"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2, Plug, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/molecules/PageHeader/PageHeader";
import SectionCard from "@/components/molecules/SectionCard/SectionCard";
import EmptyState from "@/components/molecules/EmptyState/EmptyState";
import CustomButton from "@/components/atoms/CustomButton/CustomButton";
import CustomInput from "@/components/atoms/CustomInput/CustomInput";
import KeyValueList from "@/components/molecules/KeyValueList/KeyValueList";
import CodeBlock from "@/components/molecules/CodeBlock/CodeBlock";
import { ToneBadge } from "@/components/molecules/ToneBadge/ToneBadge";
import useAxios from "@/interceptor/useAxios";
import { formatDateTime } from "@/resources/utils/helper";
import shared from "@/styles/shared.module.css";
import classes from "./page.module.css";

const str = (v) => (v === null || v === undefined ? "" : String(v));

const isInt = (v, min = -Infinity, max = Infinity) => Number.isInteger(v) && v >= min && v <= max;

const isDirty = (payload, initial) =>
  Object.keys(payload).some((k) => JSON.stringify(payload[k]) !== JSON.stringify(initial?.[k]));

export default function AdminSettingsPage() {
  const { Get, Patch } = useAxios();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null); // { current, envDefaults }

  const load = useCallback(async () => {
    setLoading(true);
    const { response } = await Get({ route: "admin/settings", showAlert: false });
    setSettings(response?.data ?? null);
    setLoading(false);
  }, [Get]);

  useEffect(() => {
    void load();
  }, [load]);

  /** PATCH one section. Resolves with the saved section values, or null on failure. */
  const saveSection = useCallback(
    async (section, values, label) => {
      const { response } = await Patch({ route: "admin/settings", data: { [section]: values } });
      if (!response?.data) return null;
      setSettings((prev) => ({ ...(prev ?? {}), current: response.data }));
      toast.success(`${label} saved`);
      return response.data[section] ?? values;
    },
    [Patch],
  );

  const current = settings?.current ?? null;
  const defaults = settings?.envDefaults ?? {};

  return (
    <div className={shared.stack}>
      <PageHeader
        title="Platform settings"
        subtitle={
          current?.updatedAt
            ? `Last updated ${formatDateTime(current.updatedAt)}. Changes apply immediately to new requests.`
            : "Scoring, AI model, ledger and API limits. Changes apply immediately to new requests."
        }
        actions={
          <CustomButton variant="outline" onClick={load} loading={loading} leftIcon={<RefreshCw size={16} />}>
            Reload
          </CustomButton>
        }
      />

      {loading && !current ? (
        <div className={shared.loaderRow}>
          <Loader2 className={shared.spin} />
        </div>
      ) : !current ? (
        <EmptyState
          icon={<AlertTriangle size={22} />}
          title="Settings unavailable"
          description="The platform settings could not be loaded."
          action={<CustomButton onClick={load}>Retry</CustomButton>}
        />
      ) : (
        <>
          <div className={classes.grid}>
            <TrustWeightsSection
              initial={current.trustWeights}
              defaults={defaults.trustWeights}
              onSave={(values) => saveSection("trustWeights", values, "Trust weights")}
            />
            <VerdictThresholdsSection
              initial={current.verdictThresholds}
              defaults={defaults.verdictThresholds}
              onSave={(values) => saveSection("verdictThresholds", values, "Verdict thresholds")}
            />
          </div>

          <AiModelSection
            initial={current.aiModel}
            defaults={defaults.aiModel}
            onSave={(values) => saveSection("aiModel", values, "AI model settings")}
          />

          <div className={classes.grid}>
            <LedgerSection
              initial={current.ledger}
              defaults={defaults.ledger}
              onSave={(values) => saveSection("ledger", values, "Ledger settings")}
            />
            <ApiKeysSection
              initial={current.apiKeys}
              defaults={defaults.apiKeys}
              onSave={(values) => saveSection("apiKeys", values, "API key limits")}
            />
          </div>

          <VerificationSection
            initial={current.verification}
            defaults={defaults.verification}
            onSave={(values) => saveSection("verification", values, "Verification settings")}
          />
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ shared bits */

function Field({ label, value, setValue, type = "text", min, max, envDefault, hint, error, maxLength = 50, disabled }) {
  return (
    <div className={classes.field}>
      <CustomInput
        label={label}
        type={type}
        value={value}
        setValue={setValue}
        min={min}
        max={max}
        error={error}
        maxLength={maxLength}
        disabled={disabled}
      />
      <p className={classes.hint}>
        {hint && <span>{hint} · </span>}
        env default: <code>{envDefault === undefined || envDefault === null || envDefault === "" ? "—" : String(envDefault)}</code>
      </p>
    </div>
  );
}

function CheckField({ label, description, checked, onChange, envDefault }) {
  return (
    <label className={shared.checkItem}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className={shared.checkTitle}>{label}</span>
        <br />
        <span className={shared.checkDesc}>
          {description}
          {envDefault !== undefined && ` · env default: ${envDefault ? "on" : "off"}`}
        </span>
      </span>
    </label>
  );
}

function SaveBar({ onSave, saving, disabled, error }) {
  return (
    <div className={classes.saveBar}>
      {error ? <span className={classes.error}>{error}</span> : <span />}
      <CustomButton onClick={onSave} loading={saving} disabled={disabled} leftIcon={<Save size={16} />}>
        Save
      </CustomButton>
    </div>
  );
}

/** Shared save handler: calls onSave, then resets local form from the saved values. */
function useSectionSave(onSave, toForm, setForm) {
  const [saving, setSaving] = useState(false);
  const save = async (payload) => {
    setSaving(true);
    const saved = await onSave(payload);
    if (saved) setForm(toForm(saved));
    setSaving(false);
  };
  return { saving, save };
}

/* ------------------------------------------------------------------ trust weights */

function TrustWeightsSection({ initial, defaults, onSave }) {
  const toForm = (v) => ({ metadata: str(v?.metadata), ai: str(v?.ai) });
  const [form, setForm] = useState(() => toForm(initial));
  const { saving, save } = useSectionSave(onSave, toForm, setForm);

  const metadata = Number(form.metadata);
  const ai = Number(form.ai);
  const sum = (Number.isFinite(metadata) ? metadata : 0) + (Number.isFinite(ai) ? ai : 0);
  const payload = { metadata, ai };
  const error =
    !Number.isFinite(metadata) || !Number.isFinite(ai) || form.metadata === "" || form.ai === ""
      ? "Both weights are required"
      : metadata < 0 || ai < 0
        ? "Weights cannot be negative"
        : sum !== 100
          ? `Weights must sum to 100 (currently ${sum})`
          : "";
  const dirty = isDirty(payload, initial);

  return (
    <SectionCard title="Trust weights" description="How much the provenance/metadata score and the AI deepfake score contribute.">
      <div className={classes.splitBar} aria-hidden>
        <div className={classes.splitMeta} style={{ width: `${Math.max(0, Math.min(100, metadata || 0))}%` }} />
        <div className={classes.splitAi} style={{ width: `${Math.max(0, Math.min(100, ai || 0))}%` }} />
      </div>
      <div className={classes.splitLegend}>
        <span>
          <i className={classes.dotMeta} /> Metadata {Number.isFinite(metadata) ? metadata : 0}%
        </span>
        <span>
          <i className={classes.dotAi} /> AI {Number.isFinite(ai) ? ai : 0}%
        </span>
        <ToneBadge tone={sum === 100 ? "success" : "danger"}>sum {sum}</ToneBadge>
      </div>
      <div className={shared.formGrid}>
        <Field
          label="Metadata weight (%)"
          type="number"
          min={0}
          max={100}
          value={form.metadata}
          setValue={(v) => setForm((f) => ({ ...f, metadata: v }))}
          envDefault={defaults?.metadata}
        />
        <Field
          label="AI weight (%)"
          type="number"
          min={0}
          max={100}
          value={form.ai}
          setValue={(v) => setForm((f) => ({ ...f, ai: v }))}
          envDefault={defaults?.ai}
          hint="Redistributed to metadata when the model is unavailable"
        />
      </div>
      <SaveBar onSave={() => save(payload)} saving={saving} disabled={Boolean(error) || !dirty} error={dirty ? error : ""} />
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ verdict thresholds */

function VerdictThresholdsSection({ initial, defaults, onSave }) {
  const toForm = (v) => ({
    trusted: str(v?.trusted),
    likelyAuthentic: str(v?.likelyAuthentic),
    suspicious: str(v?.suspicious),
  });
  const [form, setForm] = useState(() => toForm(initial));
  const { saving, save } = useSectionSave(onSave, toForm, setForm);

  const payload = {
    trusted: Number(form.trusted),
    likelyAuthentic: Number(form.likelyAuthentic),
    suspicious: Number(form.suspicious),
  };
  const values = [payload.trusted, payload.likelyAuthentic, payload.suspicious];
  const error =
    Object.values(form).some((v) => v === "") || values.some((v) => !Number.isFinite(v))
      ? "All three thresholds are required"
      : values.some((v) => v < 0 || v > 100)
        ? "Thresholds must be between 0 and 100"
        : !(payload.trusted > payload.likelyAuthentic && payload.likelyAuthentic > payload.suspicious)
          ? "Thresholds must be descending: trusted > likely authentic > suspicious"
          : "";
  const dirty = isDirty(payload, initial);

  return (
    <SectionCard title="Verdict thresholds" description="Minimum trust score for each verdict band. Anything below suspicious is untrusted.">
      <div className={classes.bands} aria-hidden>
        <span className={classes.bandUntrusted} style={{ width: `${clampPct(payload.suspicious)}%` }} />
        <span className={classes.bandSuspicious} style={{ width: `${clampPct(payload.likelyAuthentic - payload.suspicious)}%` }} />
        <span className={classes.bandLikely} style={{ width: `${clampPct(payload.trusted - payload.likelyAuthentic)}%` }} />
        <span className={classes.bandTrusted} style={{ width: `${clampPct(100 - payload.trusted)}%` }} />
      </div>
      <div className={classes.formStack}>
        <Field
          label="Trusted (≥)"
          type="number"
          min={0}
          max={100}
          value={form.trusted}
          setValue={(v) => setForm((f) => ({ ...f, trusted: v }))}
          envDefault={defaults?.trusted}
        />
        <Field
          label="Likely authentic (≥)"
          type="number"
          min={0}
          max={100}
          value={form.likelyAuthentic}
          setValue={(v) => setForm((f) => ({ ...f, likelyAuthentic: v }))}
          envDefault={defaults?.likelyAuthentic}
        />
        <Field
          label="Suspicious (≥)"
          type="number"
          min={0}
          max={100}
          value={form.suspicious}
          setValue={(v) => setForm((f) => ({ ...f, suspicious: v }))}
          envDefault={defaults?.suspicious}
        />
      </div>
      <SaveBar onSave={() => save(payload)} saving={saving} disabled={Boolean(error) || !dirty} error={dirty ? error : ""} />
    </SectionCard>
  );
}

const clampPct = (v) => (Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0);

/* ------------------------------------------------------------------ AI model */

function AiModelSection({ initial, defaults, onSave }) {
  const { Get } = useAxios();
  const toForm = (v) => ({
    enabled: Boolean(v?.enabled),
    url: str(v?.url),
    predictPath: str(v?.predictPath),
    healthPath: str(v?.healthPath),
    timeoutMs: str(v?.timeoutMs),
  });
  const [form, setForm] = useState(() => toForm(initial));
  const { saving, save } = useSectionSave(onSave, toForm, setForm);
  const [testing, setTesting] = useState(false);
  const [health, setHealth] = useState(null);

  const timeoutMs = Number(form.timeoutMs);
  const payload = {
    enabled: form.enabled,
    url: form.url.trim(),
    predictPath: form.predictPath.trim(),
    healthPath: form.healthPath.trim(),
    timeoutMs,
  };
  const error = !payload.url
    ? "Model URL is required"
    : !/^https?:\/\//i.test(payload.url)
      ? "Model URL must start with http:// or https://"
      : !payload.predictPath.startsWith("/") || !payload.healthPath.startsWith("/")
        ? "Paths must start with /"
        : !isInt(timeoutMs, 1000, 120000)
          ? "Timeout must be an integer between 1000 and 120000 ms"
          : "";
  const dirty = isDirty(payload, initial);

  const testConnection = async () => {
    setTesting(true);
    const { response, message } = await Get({ route: "admin/ai/health", showAlert: false });
    setHealth(response?.data ?? { ok: false, status: "error", detail: message });
    setTesting(false);
  };

  return (
    <SectionCard
      title="AI deepfake model"
      description="FastAPI detector consulted for every verification. The health check uses the saved configuration."
      actions={
        <CustomButton variant="outline" onClick={testConnection} loading={testing} leftIcon={<Plug size={16} />}>
          Test connection
        </CustomButton>
      }
    >
      {health && (
        <div className={classes.healthPanel} data-ok={health.ok ? "true" : "false"}>
          <KeyValueList
            columns={3}
            dense
            items={[
              {
                label: "Result",
                value: (
                  <ToneBadge tone={health.ok ? "success" : "danger"} dot>
                    {health.ok ? "reachable" : "unreachable"}
                  </ToneBadge>
                ),
              },
              { label: "Status", value: health.status },
              { label: "Latency", value: typeof health.latencyMs === "number" ? `${health.latencyMs} ms` : null },
              { label: "Circuit breaker", value: health.circuitOpen ? "open" : "closed" },
              { label: "URL", value: health.url, mono: true },
            ]}
          />
          {health.detail !== undefined && health.detail !== null && (
            <div className={classes.healthDetail}>
              {typeof health.detail === "string" ? (
                <p className={classes.hint}>{health.detail}</p>
              ) : (
                <CodeBlock code={health.detail} language="json" title="health response" maxHeight={180} />
              )}
            </div>
          )}
        </div>
      )}

      <div className={shared.checkList}>
        <CheckField
          label="Enable AI analysis"
          description="When disabled the AI weight is redistributed to metadata and reports mark the model as disabled."
          checked={form.enabled}
          onChange={(v) => setForm((f) => ({ ...f, enabled: v }))}
          envDefault={defaults?.enabled}
        />
      </div>
      <div className={shared.formGrid} style={{ marginTop: 16 }}>
        <Field
          label="Model URL"
          value={form.url}
          setValue={(v) => setForm((f) => ({ ...f, url: v }))}
          envDefault={defaults?.url}
          maxLength={300}
        />
        <Field
          label="Timeout (ms)"
          type="number"
          min={1000}
          max={120000}
          value={form.timeoutMs}
          setValue={(v) => setForm((f) => ({ ...f, timeoutMs: v }))}
          envDefault={defaults?.timeoutMs}
          hint="1000 – 120000"
        />
        <Field
          label="Predict path"
          value={form.predictPath}
          setValue={(v) => setForm((f) => ({ ...f, predictPath: v }))}
          envDefault={defaults?.predictPath}
          maxLength={120}
        />
        <Field
          label="Health path"
          value={form.healthPath}
          setValue={(v) => setForm((f) => ({ ...f, healthPath: v }))}
          envDefault={defaults?.healthPath}
          maxLength={120}
        />
      </div>
      <SaveBar onSave={() => save(payload)} saving={saving} disabled={Boolean(error) || !dirty} error={dirty ? error : ""} />
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ ledger */

function LedgerSection({ initial, defaults, onSave }) {
  const toForm = (v) => ({
    blockSize: str(v?.blockSize),
    blockIntervalSeconds: str(v?.blockIntervalSeconds),
    difficulty: str(v?.difficulty),
  });
  const [form, setForm] = useState(() => toForm(initial));
  const { saving, save } = useSectionSave(onSave, toForm, setForm);

  const payload = {
    blockSize: Number(form.blockSize),
    blockIntervalSeconds: Number(form.blockIntervalSeconds),
    difficulty: Number(form.difficulty),
  };
  const error = !isInt(payload.blockSize, 1, 5000)
    ? "Block size must be an integer between 1 and 5000"
    : !isInt(payload.blockIntervalSeconds, 5, 86400)
      ? "Seal interval must be an integer between 5 and 86400 seconds"
      : !isInt(payload.difficulty, 0, 5)
        ? "Difficulty must be an integer between 0 and 5"
        : "";
  const dirty = isDirty(payload, initial);

  return (
    <SectionCard title="Ledger" description="When pending entries are sealed into a block and how hard each block is to mine.">
      <div className={classes.formStack}>
        <Field
          label="Block size (entries)"
          type="number"
          min={1}
          max={5000}
          value={form.blockSize}
          setValue={(v) => setForm((f) => ({ ...f, blockSize: v }))}
          envDefault={defaults?.blockSize}
          hint="Seal as soon as this many entries are pending"
        />
        <Field
          label="Seal interval (seconds)"
          type="number"
          min={5}
          max={86400}
          value={form.blockIntervalSeconds}
          setValue={(v) => setForm((f) => ({ ...f, blockIntervalSeconds: v }))}
          envDefault={defaults?.blockIntervalSeconds}
          hint="Seal at least this often while entries are pending"
        />
        <Field
          label="Difficulty (0 – 5)"
          type="number"
          min={0}
          max={5}
          value={form.difficulty}
          setValue={(v) => setForm((f) => ({ ...f, difficulty: v }))}
          envDefault={defaults?.difficulty}
          hint="Leading zero hex digits required in the block hash — higher difficulty means slower sealing"
        />
      </div>
      <SaveBar onSave={() => save(payload)} saving={saving} disabled={Boolean(error) || !dirty} error={dirty ? error : ""} />
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ API keys */

function ApiKeysSection({ initial, defaults, onSave }) {
  const toForm = (v) => ({
    defaultRateLimitPerMinute: str(v?.defaultRateLimitPerMinute),
    maxKeysPerUser: str(v?.maxKeysPerUser),
  });
  const [form, setForm] = useState(() => toForm(initial));
  const { saving, save } = useSectionSave(onSave, toForm, setForm);

  const payload = {
    defaultRateLimitPerMinute: Number(form.defaultRateLimitPerMinute),
    maxKeysPerUser: Number(form.maxKeysPerUser),
  };
  const error = !isInt(payload.defaultRateLimitPerMinute, 1)
    ? "Default rate limit must be a positive integer"
    : !isInt(payload.maxKeysPerUser, 1)
      ? "Max keys per user must be a positive integer"
      : "";
  const dirty = isDirty(payload, initial);

  return (
    <SectionCard title="API keys" description="Defaults applied when users create keys. Existing keys keep their own limits.">
      <div className={classes.formStack}>
        <Field
          label="Default rate limit (requests / minute)"
          type="number"
          min={1}
          max={100000}
          value={form.defaultRateLimitPerMinute}
          setValue={(v) => setForm((f) => ({ ...f, defaultRateLimitPerMinute: v }))}
          envDefault={defaults?.defaultRateLimitPerMinute}
        />
        <Field
          label="Max active keys per user"
          type="number"
          min={1}
          max={1000}
          value={form.maxKeysPerUser}
          setValue={(v) => setForm((f) => ({ ...f, maxKeysPerUser: v }))}
          envDefault={defaults?.maxKeysPerUser}
        />
      </div>
      <SaveBar onSave={() => save(payload)} saving={saving} disabled={Boolean(error) || !dirty} error={dirty ? error : ""} />
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ verification */

function VerificationSection({ initial, defaults, onSave }) {
  const toForm = (v) => ({
    phashDistanceThreshold: str(v?.phashDistanceThreshold),
    maxFileSizeMb: str(v?.maxFileSizeMb),
    allowAnonymousDashboardVerify: Boolean(v?.allowAnonymousDashboardVerify),
  });
  const [form, setForm] = useState(() => toForm(initial));
  const { saving, save } = useSectionSave(onSave, toForm, setForm);

  const payload = {
    phashDistanceThreshold: Number(form.phashDistanceThreshold),
    maxFileSizeMb: Number(form.maxFileSizeMb),
    allowAnonymousDashboardVerify: form.allowAnonymousDashboardVerify,
  };
  const error = !isInt(payload.phashDistanceThreshold, 0, 32)
    ? "pHash distance must be an integer between 0 and 32"
    : !Number.isFinite(payload.maxFileSizeMb) || payload.maxFileSizeMb <= 0 || form.maxFileSizeMb === ""
      ? "Max file size must be a positive number"
      : "";
  const dirty = isDirty(payload, initial);

  return (
    <SectionCard title="Verification" description="Near-match sensitivity, upload limits and anonymous access to the public verifier.">
      <div className={shared.formGrid}>
        <Field
          label="pHash distance threshold (0 – 32)"
          type="number"
          min={0}
          max={32}
          value={form.phashDistanceThreshold}
          setValue={(v) => setForm((f) => ({ ...f, phashDistanceThreshold: v }))}
          envDefault={defaults?.phashDistanceThreshold}
          hint="Max Hamming distance for a near match — lower is stricter"
        />
        <Field
          label="Max upload size (MB)"
          type="number"
          min={1}
          max={1024}
          value={form.maxFileSizeMb}
          setValue={(v) => setForm((f) => ({ ...f, maxFileSizeMb: v }))}
          envDefault={defaults?.maxFileSizeMb}
        />
      </div>
      <div className={shared.checkList} style={{ marginTop: 16 }}>
        <CheckField
          label="Allow anonymous dashboard verification"
          description="Let visitors verify images without signing in. Reports are still stored and rate limited."
          checked={form.allowAnonymousDashboardVerify}
          onChange={(v) => setForm((f) => ({ ...f, allowAnonymousDashboardVerify: v }))}
          envDefault={defaults?.allowAnonymousDashboardVerify}
        />
      </div>
      <SaveBar onSave={() => save(payload)} saving={saving} disabled={Boolean(error) || !dirty} error={dirty ? error : ""} />
    </SectionCard>
  );
}
