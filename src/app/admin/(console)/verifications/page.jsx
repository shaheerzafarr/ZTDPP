"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ScanSearch, X } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader/PageHeader";
import EmptyState from "@/components/molecules/EmptyState/EmptyState";
import AppTable from "@/components/organisms/AppTable";
import { RenderGeneralTextCell } from "@/components/organisms/AppTable/tableHelper";
import { ClassificationBadge, MatchBadge, ToneBadge, VerdictBadge } from "@/components/molecules/ToneBadge/ToneBadge";
import HashChip from "@/components/molecules/HashChip/HashChip";
import useAxios from "@/interceptor/useAxios";
import { extractItems, extractTotalRecords } from "@/resources/utils/apiResponse";
import { MATCH_LABELS, VERDICTS } from "@/resources/constants/ztdpp";
import { formatDateTime, formatNumber, formatPercent, getDisplayName, scoreTone, shortId } from "@/resources/utils/helper";
import shared from "@/styles/shared.module.css";
import classes from "./page.module.css";

const LIMIT = 10;

export default function AdminVerificationsPage() {
  return (
    <Suspense
      fallback={
        <div className={shared.loaderRow}>
          <Loader2 className={shared.spin} />
        </div>
      }
    >
      <AdminVerificationsContent />
    </Suspense>
  );
}

function AdminVerificationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requester = searchParams.get("requester") ?? "";
  const { Get } = useAxios();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [verdict, setVerdict] = useState("");
  const [match, setMatch] = useState("");
  const [source, setSource] = useState("");

  useEffect(() => {
    setPage(1);
  }, [verdict, match, source, requester]);

  const load = useCallback(async () => {
    setLoading(true);
    const { response } = await Get({
      route: "admin/verifications",
      params: {
        page,
        limit: LIMIT,
        ...(verdict ? { verdict } : {}),
        ...(match ? { match } : {}),
        ...(source ? { source } : {}),
        ...(requester ? { requester } : {}),
      },
      showAlert: false,
    });
    setItems(extractItems(response));
    setTotal(extractTotalRecords(response));
    setLoading(false);
  }, [Get, page, verdict, match, source, requester]);

  useEffect(() => {
    void load();
  }, [load]);

  const requesterLabel = (() => {
    if (!requester) return "";
    const found = items.find((v) => v.requester && typeof v.requester === "object" && v.requester._id === requester);
    return found ? getDisplayName(found.requester) : shortId(requester);
  })();

  const headers = [
    {
      key: "file",
      title: "File",
      renderItem: ({ data }) => (
        <div>
          <RenderGeneralTextCell text={data.fileName ?? "upload"} fontType="medium" />
          <div className={classes.sub}>{formatDateTime(data.createdAt)}</div>
        </div>
      ),
    },
    {
      key: "trustScore",
      title: "Score",
      renderItem: ({ data }) => (
        <span className={classes.score} data-tone={scoreTone(data.trustScore)}>
          {typeof data.trustScore === "number" ? data.trustScore : "—"}
        </span>
      ),
    },
    { key: "verdict", title: "Verdict", renderItem: ({ data }) => <VerdictBadge verdict={data.verdict} /> },
    {
      key: "classification",
      title: "Classification",
      renderItem: ({ data }) => <ClassificationBadge classification={data.classification} />,
    },
    { key: "provenanceMatch", title: "Provenance", renderItem: ({ data }) => <MatchBadge match={data.provenanceMatch} /> },
    {
      key: "ai",
      title: "AI",
      renderItem: ({ data }) =>
        data.ai?.status === "ok" ? (
          <div>
            <RenderGeneralTextCell text={data.ai.label ?? "—"} fontType="regular" />
            <div className={classes.sub}>P(fake) {formatPercent(data.ai.fakeProbability)}</div>
          </div>
        ) : (
          <ToneBadge tone="neutral">{data.ai?.status ?? "n/a"}</ToneBadge>
        ),
    },
    {
      key: "requester",
      title: "Requester",
      renderItem: ({ data }) => <RequesterCell requester={data.requester} />,
    },
    {
      key: "source",
      title: "Source",
      renderItem: ({ data }) => (
        <div>
          <ToneBadge tone={data.source === "api" ? "info" : "neutral"}>{data.source ?? "—"}</ToneBadge>
          {data.apiKey?.name && <div className={classes.sub}>{data.apiKey.name}</div>}
        </div>
      ),
    },
    { key: "contentHash", title: "SHA-256", renderItem: ({ data }) => <HashChip value={data.contentHash} /> },
  ];

  const hasFilters = Boolean(verdict || match || source || requester);

  return (
    <div className={shared.stack}>
      <PageHeader title="Verifications" subtitle="Every trust report produced by the platform, from the API and the dashboard." />

      <div className={shared.toolbar}>
        <div className={shared.filters}>
          <select className={shared.select} value={verdict} onChange={(e) => setVerdict(e.target.value)}>
            <option value="">All verdicts</option>
            {Object.entries(VERDICTS).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>
          <select className={shared.select} value={match} onChange={(e) => setMatch(e.target.value)}>
            <option value="">All provenance</option>
            {Object.entries(MATCH_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select className={shared.select} value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="">All sources</option>
            <option value="api">API</option>
            <option value="dashboard">Dashboard</option>
          </select>
          {requester && (
            <button type="button" className={classes.filterChip} onClick={() => router.push("/admin/verifications")}>
              Requester: {requesterLabel}
              <X size={14} />
            </button>
          )}
        </div>
        <span className={shared.muted}>
          {formatNumber(total)} verification{total === 1 ? "" : "s"}
        </span>
      </div>

      {!loading && items.length === 0 ? (
        <EmptyState
          icon={<ScanSearch size={22} />}
          title={hasFilters ? "No verifications match" : "No verifications yet"}
          description={
            hasFilters ? "Try a different verdict, provenance, source or requester filter." : "Reports will appear here as images are verified."
          }
        />
      ) : (
        <AppTable
          data={items}
          tableHeader={headers}
          loading={loading}
          page={page}
          totalRecords={total}
          limitPerPage={LIMIT}
          onPageChange={setPage}
          onRowClick={(row) => router.push(`/admin/verifications/${encodeURIComponent(row.verificationId)}`)}
        />
      )}
    </div>
  );
}

function RequesterCell({ requester }) {
  if (!requester) return <span className={shared.muted}>anonymous</span>;
  if (typeof requester === "object") {
    return (
      <div>
        <RenderGeneralTextCell text={getDisplayName(requester)} fontType="medium" />
        {requester.email && <div className={classes.sub}>{requester.email}</div>}
      </div>
    );
  }
  return <code className={shared.mono}>{shortId(requester)}</code>;
}
