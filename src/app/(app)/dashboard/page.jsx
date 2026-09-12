"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Activity, Boxes, ChevronRight, KeyRound, ScanSearch, ShieldCheck } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
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
import AppTable from "@/components/organisms/AppTable";
import { RenderGeneralTextCell } from "@/components/organisms/AppTable/tableHelper";
import { MatchBadge, OriginBadge, VerdictBadge } from "@/components/molecules/ToneBadge/ToneBadge";
import HashChip from "@/components/molecules/HashChip/HashChip";
import useAxios from "@/interceptor/useAxios";
import { extractItems, extractTotalRecords } from "@/resources/utils/apiResponse";
import { formatDateTime, getDisplayName } from "@/resources/utils/helper";
import shared from "@/styles/shared.module.css";
import classes from "./page.module.css";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

export default function DashboardPage() {
  const router = useRouter();
  const { Get } = useAxios();
  const { user } = useSelector((state) => state.authReducer);
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState({ items: [], total: 0 });
  const [assets, setAssets] = useState({ items: [], total: 0 });
  const [verifications, setVerifications] = useState({ items: [], total: 0 });
  const [usage, setUsage] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [k, a, v, u] = await Promise.all([
        Get({ route: "api-keys", params: { page: 1, limit: 5, status: "active" }, showAlert: false }),
        Get({ route: "assets", params: { page: 1, limit: 5 }, showAlert: false }),
        Get({ route: "verifications", params: { page: 1, limit: 8 }, showAlert: false }),
        Get({ route: "api-keys/usage", params: { days: 30 }, showAlert: false }),
      ]);
      setKeys({ items: extractItems(k.response), total: extractTotalRecords(k.response) });
      setAssets({ items: extractItems(a.response), total: extractTotalRecords(a.response) });
      setVerifications({ items: extractItems(v.response), total: extractTotalRecords(v.response) });
      setUsage(Array.isArray(u.response?.data) ? u.response.data : []);
      setLoading(false);
    };
    void load();
  }, []);

  const series = useMemo(() => {
    const byDay = new Map();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      byDay.set(d, { day: d.slice(5), register: 0, verify: 0, lookup: 0 });
    }
    for (const row of usage) {
      const bucket = byDay.get(row.day);
      if (!bucket) continue;
      if (row.event === "register" || row.event === "edit") bucket.register += row.count;
      else if (row.event === "verify") bucket.verify += row.count;
      else bucket.lookup += row.count;
    }
    return [...byDay.values()];
  }, [usage]);

  const avgScore = useMemo(() => {
    const scored = verifications.items.filter((v) => typeof v.trustScore === "number");
    if (!scored.length) return null;
    return Math.round(scored.reduce((s, v) => s + v.trustScore, 0) / scored.length);
  }, [verifications.items]);

  const verificationHeaders = [
    {
      key: "file",
      title: "File",
      renderItem: ({ data }) => (
        <div>
          <RenderGeneralTextCell text={data.fileName ?? "upload"} fontType="medium" />
          <div className={classes.subCell}>{formatDateTime(data.createdAt)}</div>
        </div>
      ),
    },
    { key: "trustScore", title: "Score", renderItem: ({ data }) => <span className={classes.score}>{data.trustScore}</span> },
    { key: "verdict", title: "Verdict", renderItem: ({ data }) => <VerdictBadge verdict={data.verdict} /> },
    { key: "provenanceMatch", title: "Provenance", renderItem: ({ data }) => <MatchBadge match={data.provenanceMatch} /> },
    { key: "contentHash", title: "SHA-256", renderItem: ({ data }) => <HashChip value={data.contentHash} /> },
  ];

  const assetHeaders = [
    {
      key: "title",
      title: "Asset",
      renderItem: ({ data }) => (
        <div>
          <RenderGeneralTextCell text={data.title || data.externalId || data.assetId.split(":").pop()} fontType="medium" />
          <div className={classes.subCell}>v{data.versionCount} · {formatDateTime(data.createdAt)}</div>
        </div>
      ),
    },
    { key: "origin", title: "Origin", renderItem: ({ data }) => <OriginBadge origin={data.currentOriginType} short /> },
    { key: "hash", title: "Latest hash", renderItem: ({ data }) => <HashChip value={data.latestContentHash} /> },
  ];

  return (
    <div className={shared.stack}>
      <PageHeader
        title={`${greeting()}, ${user?.firstName ?? getDisplayName(user)} 👋`}
        subtitle="Your provenance activity at a glance."
        actions={
          <CustomButton onClick={() => router.push("/verify")} leftIcon={<ScanSearch size={16} />}>
            Verify an image
          </CustomButton>
        }
      />

      <div className={shared.statsGrid}>
        <StatsCard icon={<KeyRound />} label="Active API keys" value={keys.total} />
        <StatsCard icon={<Boxes />} label="Registered assets" value={assets.total} />
        <StatsCard icon={<Activity />} label="Verifications" value={verifications.total} />
        <StatsCard icon={<ShieldCheck />} label="Avg. trust score (recent)" value={avgScore ?? "—"} />
      </div>

      <SectionCard title="API activity" description="Registrations, verifications and lookups over the last 30 days.">
        <div className={shared.chartWrap}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="gVerify" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(175 84% 32%)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(175 84% 32%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gRegister" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 24% 92%)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Area type="monotone" dataKey="verify" name="Verifications" stroke="hsl(175 84% 32%)" fill="url(#gVerify)" strokeWidth={2} />
              <Area type="monotone" dataKey="register" name="Registrations" stroke="#2563eb" fill="url(#gRegister)" strokeWidth={2} />
              <Area type="monotone" dataKey="lookup" name="Lookups" stroke="#f59e0b" fill="transparent" strokeWidth={1.5} strokeDasharray="4 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <div className={shared.twoCol}>
        <SectionCard
          title="Recent verifications"
          padded={false}
          actions={
            <Link href="/verifications" className={shared.linkButton}>
              View all <ChevronRight size={14} />
            </Link>
          }
        >
          {!loading && verifications.items.length === 0 ? (
            <EmptyState
              compact
              icon={<ScanSearch size={22} />}
              title="No verifications yet"
              description="Upload an image to get your first trust report."
              action={<CustomButton onClick={() => router.push("/verify")}>Verify an image</CustomButton>}
            />
          ) : (
            <AppTable
              data={verifications.items}
              tableHeader={verificationHeaders}
              loading={loading}
              onRowClick={(row) => router.push(`/verifications/${encodeURIComponent(row.verificationId)}`)}
            />
          )}
        </SectionCard>

        <div className={classes.rightColumn}>
          <SectionCard
            title="Latest assets"
            padded={false}
            actions={
              <Link href="/assets" className={shared.linkButton}>
                View all <ChevronRight size={14} />
              </Link>
            }
          >
            {!loading && assets.items.length === 0 ? (
              <EmptyState
                compact
                icon={<Boxes size={22} />}
                title="Nothing registered"
                description="Register content from the Assets page or through the API."
              />
            ) : (
              <AppTable
                data={assets.items}
                tableHeader={assetHeaders}
                loading={loading}
                onRowClick={(row) => router.push(`/assets/${encodeURIComponent(row.assetId)}`)}
              />
            )}
          </SectionCard>

          <SectionCard title="Get started">
            <ol className={classes.checklist}>
              <li data-done={keys.total > 0}>
                <Link href="/api-keys">Create an API key</Link>
              </li>
              <li data-done={assets.total > 0}>
                <Link href="/docs">Register content from your platform</Link>
              </li>
              <li data-done={verifications.total > 0}>
                <Link href="/verify">Run a verification</Link>
              </li>
            </ol>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
