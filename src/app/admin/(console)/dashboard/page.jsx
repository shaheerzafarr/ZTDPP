"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Blocks,
  Boxes,
  BrainCircuit,
  Clock,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/molecules/PageHeader/PageHeader";
import { StatsCard } from "@/components/molecules/StatsCard/StatsCard";
import SectionCard from "@/components/molecules/SectionCard/SectionCard";
import EmptyState from "@/components/molecules/EmptyState/EmptyState";
import CustomButton from "@/components/atoms/CustomButton/CustomButton";
import KeyValueList from "@/components/molecules/KeyValueList/KeyValueList";
import HashChip from "@/components/molecules/HashChip/HashChip";
import { ScoreBar } from "@/components/molecules/TrustGauge/TrustGauge";
import { MatchBadge, OriginBadge, ToneBadge, VerdictBadge } from "@/components/molecules/ToneBadge/ToneBadge";
import useAxios from "@/interceptor/useAxios";
import { ORIGINS, VERDICTS } from "@/resources/constants/ztdpp";
import { formatDateTime, formatNumber } from "@/resources/utils/helper";
import shared from "@/styles/shared.module.css";
import classes from "./page.module.css";

const PERIODS = [
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
];

const MATCH_TONES = { exact: "success", near: "warning", none: "neutral" };

const TOOLTIP_STYLE = { borderRadius: 10, fontSize: 12 };
const GRID_STROKE = "hsl(214 24% 92%)";
const TEAL = "hsl(175 84% 32%)";
const BLUE = "#2563eb";
const AMBER = "#f59e0b";

/** Build a zero-filled day map for the last `days` days (oldest first). */
function buildDayBuckets(days, factory) {
  const byDay = new Map();
  for (let i = days - 1; i >= 0; i--) {
    const iso = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    byDay.set(iso, { iso, day: iso.slice(5), ...factory() });
  }
  return byDay;
}

export default function AdminDashboardPage() {
  const { Get } = useAxios();
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { response } = await Get({ route: "admin/dashboard", params: { days }, showAlert: false });
    setData(response?.data ?? null);
    setLoading(false);
  }, [Get, days]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = data?.totals ?? {};
  const distributions = data?.distributions ?? {};
  const ledger = data?.ledger ?? null;
  const ai = data?.ai ?? null;
  const signer = data?.signer ?? null;

  const verificationSeries = useMemo(() => {
    const byDay = buildDayBuckets(days, () => ({ count: 0, avgScore: null }));
    for (const row of data?.series?.verifications ?? []) {
      const bucket = byDay.get(row.day);
      if (!bucket) continue;
      bucket.count = row.count ?? 0;
      bucket.avgScore = typeof row.avgScore === "number" ? Math.round(row.avgScore) : null;
    }
    return [...byDay.values()];
  }, [data, days]);

  const registrationSeries = useMemo(() => {
    const byDay = buildDayBuckets(days, () => ({ count: 0 }));
    for (const row of data?.series?.registrations ?? []) {
      const bucket = byDay.get(row.day);
      if (bucket) bucket.count = row.count ?? 0;
    }
    return [...byDay.values()];
  }, [data, days]);

  const tickInterval = Math.max(0, Math.round(days / 7) - 1);

  const verdictRows = useMemo(() => toRows(distributions.verdicts, Object.keys(VERDICTS)), [distributions.verdicts]);
  const originRows = useMemo(() => toRows(distributions.origins, Object.keys(ORIGINS)), [distributions.origins]);
  const matchRows = useMemo(
    () => toRows(distributions.provenanceMatch, ["exact", "near", "none"]),
    [distributions.provenanceMatch],
  );

  const aiStatusValue = ai
    ? ai.ok
      ? `ok · ${ai.latencyMs ?? 0} ms`
      : ai.status ?? "unavailable"
    : "—";

  const periodLabel = PERIODS.find((p) => p.value === days)?.label.toLowerCase() ?? `last ${days} days`;

  return (
    <div className={shared.stack}>
      <PageHeader
        title="Platform overview"
        subtitle="Usage, trust outcomes and system health across every tenant."
        actions={
          <div className={shared.filters}>
            <select className={shared.select} value={days} onChange={(e) => setDays(Number(e.target.value))}>
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <CustomButton variant="outline" onClick={load} loading={loading} leftIcon={<RefreshCw size={16} />}>
              Refresh
            </CustomButton>
          </div>
        }
      />

      {loading && !data ? (
        <div className={shared.loaderRow}>
          <Loader2 className={shared.spin} />
        </div>
      ) : !data ? (
        <EmptyState
          icon={<AlertTriangle size={22} />}
          title="Dashboard unavailable"
          description="The admin dashboard could not be loaded. Check that the API is reachable and try again."
          action={<CustomButton onClick={load}>Retry</CustomButton>}
        />
      ) : (
        <>
          <div className={shared.statsGrid}>
            <StatsCard icon={<Users />} label="Users" value={formatNumber(totals.users?.total ?? 0)} />
            <StatsCard icon={<KeyRound />} label="Active API keys" value={formatNumber(totals.activeApiKeys ?? 0)} />
            <StatsCard icon={<Boxes />} label="Registered assets" value={formatNumber(totals.assets ?? 0)} />
            <StatsCard
              icon={<Activity />}
              label={`Verifications (${periodLabel})`}
              value={formatNumber(totals.verificationsInPeriod ?? 0)}
            />
            <StatsCard
              icon={<ShieldCheck />}
              label="Avg. trust score"
              value={typeof totals.averageTrustScore === "number" ? totals.averageTrustScore : "—"}
            />
            <StatsCard icon={<Blocks />} label="Ledger height" value={formatNumber(ledger?.height ?? 0)} />
            <StatsCard icon={<Clock />} label="Pending ledger entries" value={formatNumber(ledger?.pendingEntries ?? 0)} />
            <StatsCard icon={<BrainCircuit />} label="AI model" value={aiStatusValue} />
          </div>

          <SectionCard
            title="Verifications per day"
            description="Daily verification volume with the average trust score of that day's reports."
          >
            <div className={shared.chartWrap}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={verificationSeries} margin={{ top: 8, right: 0, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gAdminVerify" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={TEAL} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={TEAL} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={tickInterval} />
                  <YAxis yAxisId="count" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis
                    yAxisId="score"
                    orientation="right"
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={44}
                  />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    yAxisId="count"
                    type="monotone"
                    dataKey="count"
                    name="Verifications"
                    stroke={TEAL}
                    fill="url(#gAdminVerify)"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="score"
                    type="monotone"
                    dataKey="avgScore"
                    name="Avg. trust score"
                    stroke={AMBER}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <div className={classes.halfGrid}>
            <SectionCard title="Registrations per day" description="Manifests registered through the API and dashboard.">
              <div className={shared.chartWrap}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={registrationSeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={tickInterval} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "hsl(210 40% 96%)" }} />
                    <Bar dataKey="count" name="Registrations" fill={BLUE} radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Verdict distribution" description="All verifications ever recorded, by verdict.">
              <DistributionList
                rows={verdictRows}
                renderLabel={(key) => <VerdictBadge verdict={key} />}
                toneFor={(key) => VERDICTS[key]?.tone ?? "neutral"}
              />
            </SectionCard>
          </div>

          <div className={classes.halfGrid}>
            <SectionCard title="Origin distribution" description="Declared origin of every registered manifest.">
              <DistributionList
                rows={originRows}
                renderLabel={(key) => <OriginBadge origin={key} />}
                toneFor={(key) => ORIGINS[key]?.tone ?? "neutral"}
              />
            </SectionCard>

            <SectionCard title="Provenance match" description={`Verifications ${periodLabel} matched against the registry.`}>
              <DistributionList
                rows={matchRows}
                renderLabel={(key) => <MatchBadge match={key} />}
                toneFor={(key) => MATCH_TONES[key] ?? "neutral"}
              />
            </SectionCard>
          </div>

          <SectionCard title="System" description="AI model, signing key and ledger configuration.">
            {signer?.ephemeral && (
              <div className={classes.warning}>
                <AlertTriangle size={18} />
                <span>
                  Ephemeral signing key — manifests and blocks signed now will not verify after a restart. Run{" "}
                  <code>npm run keys:generate</code> on the API server.
                </span>
              </div>
            )}
            <KeyValueList
              columns={3}
              dense
              items={[
                { label: "AI model URL", value: ai?.url, mono: true },
                {
                  label: "AI status",
                  value: ai ? (
                    <ToneBadge tone={ai.ok ? "success" : "danger"} dot>
                      {ai.status ?? (ai.ok ? "ok" : "unavailable")}
                    </ToneBadge>
                  ) : null,
                },
                { label: "AI latency", value: ai ? `${ai.latencyMs ?? 0} ms` : null },
                {
                  label: "Circuit breaker",
                  value: ai ? (
                    <ToneBadge tone={ai.circuitOpen ? "warning" : "success"}>{ai.circuitOpen ? "open" : "closed"}</ToneBadge>
                  ) : null,
                },
                {
                  label: "Signer key",
                  value: signer?.keyId ? (
                    <span className={classes.inlineRow}>
                      <HashChip value={signer.keyId} head={12} tail={6} />
                      {signer.ephemeral && (
                        <ToneBadge tone="warning" dot>
                          ephemeral
                        </ToneBadge>
                      )}
                    </span>
                  ) : null,
                },
                { label: "Ledger difficulty", value: ledger?.config?.difficulty ?? null },
                { label: "Block size", value: ledger?.config?.blockSize ? `${ledger.config.blockSize} entries` : null },
                {
                  label: "Seal interval",
                  value: ledger?.config?.blockIntervalSeconds ? `${ledger.config.blockIntervalSeconds} s` : null,
                },
                { label: "Total entries", value: formatNumber(ledger?.totalEntries ?? 0) },
                {
                  label: "Last block",
                  value: ledger?.lastBlock ? (
                    <span className={classes.inlineRow}>
                      <span className={classes.blockIndex}>#{ledger.lastBlock.index}</span>
                      <HashChip value={ledger.lastBlock.hash} />
                    </span>
                  ) : (
                    "genesis only"
                  ),
                },
                {
                  label: "Last block sealed",
                  value: ledger?.lastBlock?.timestamp ? formatDateTime(ledger.lastBlock.timestamp) : null,
                },
              ]}
            />
          </SectionCard>
        </>
      )}
    </div>
  );
}

/** Turn a {[key]: count} map into ordered rows with percentages. Known keys first, then unknown ones. */
function toRows(map, orderedKeys) {
  const source = map ?? {};
  const keys = [...orderedKeys, ...Object.keys(source).filter((k) => !orderedKeys.includes(k))];
  const total = keys.reduce((sum, k) => sum + (source[k] ?? 0), 0);
  return keys
    .map((key) => {
      const count = source[key] ?? 0;
      return { key, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 };
    })
    .filter((row) => row.count > 0 || orderedKeys.includes(row.key));
}

function DistributionList({ rows, renderLabel, toneFor }) {
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  if (!total) return <p className={shared.muted}>No data yet.</p>;
  return (
    <ul className={classes.distList}>
      {rows.map((row) => (
        <li key={row.key} className={classes.distRow}>
          <div className={classes.distLabel}>{renderLabel(row.key)}</div>
          <div className={classes.distMeta}>
            <strong>{formatNumber(row.count)}</strong> · {row.pct}%
          </div>
          <ScoreBar score={row.count} max={total} tone={toneFor(row.key)} className={classes.distBar} />
        </li>
      ))}
    </ul>
  );
}
