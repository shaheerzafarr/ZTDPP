"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScanSearch } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader/PageHeader";
import EmptyState from "@/components/molecules/EmptyState/EmptyState";
import CustomButton from "@/components/atoms/CustomButton/CustomButton";
import AppTable from "@/components/organisms/AppTable";
import { RenderGeneralTextCell } from "@/components/organisms/AppTable/tableHelper";
import {
  ClassificationBadge,
  MatchBadge,
  VerdictBadge,
} from "@/components/molecules/ToneBadge/ToneBadge";
import HashChip from "@/components/molecules/HashChip/HashChip";
import useAxios from "@/interceptor/useAxios";
import { extractItems, extractTotalRecords } from "@/resources/utils/apiResponse";
import { aiSignalLabel, VERDICTS, MATCH_LABELS } from "@/resources/constants/ztdpp";
import { formatDateTime, formatPercent } from "@/resources/utils/helper";
import shared from "@/styles/shared.module.css";
import classes from "./page.module.css";

const LIMIT = 10;

export default function VerificationsPage() {
  const router = useRouter();
  const { Get } = useAxios();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [verdict, setVerdict] = useState("");
  const [match, setMatch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { response } = await Get({
      route: "verifications",
      params: {
        page,
        limit: LIMIT,
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
        ...(verdict ? { verdict } : {}),
        ...(match ? { match } : {}),
      },
      showAlert: false,
    });
    setItems(extractItems(response));
    setTotal(extractTotalRecords(response));
    setLoading(false);
  }, [page, verdict, match, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

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
      renderItem: ({ data }) => <span className={classes.score}>{data.trustScore ?? "—"}</span>,
    },
    { key: "verdict", title: "Verdict", renderItem: ({ data }) => <VerdictBadge verdict={data.verdict} /> },
    {
      key: "classification",
      title: "Classification",
      renderItem: ({ data }) => <ClassificationBadge classification={data.classification} />,
    },
    {
      key: "provenanceMatch",
      title: "Provenance",
      renderItem: ({ data }) => <MatchBadge match={data.provenanceMatch} />,
    },
    {
      key: "ai",
      title: "AI",
      renderItem: ({ data }) =>
        data.ai?.status === "ok" ? (
          <div>
            <RenderGeneralTextCell text={aiSignalLabel(data.ai.label)} fontType="medium" />
            <div className={classes.sub}>AI-generated probability {formatPercent(data.ai.fakeProbability)}</div>
          </div>
        ) : (
          <RenderGeneralTextCell text={data.ai?.status ?? "n/a"} fontType="light" />
        ),
    },
    {
      key: "source",
      title: "Source",
      renderItem: ({ data }) => (
        <div>
          <RenderGeneralTextCell text={data.source === "api" ? "API" : "Dashboard"} fontType="regular" />
          {data.apiKey?.name && <div className={classes.sub}>{data.apiKey.name}</div>}
        </div>
      ),
    },
    {
      key: "contentHash",
      title: "SHA-256",
      renderItem: ({ data }) => <HashChip value={data.contentHash} />,
    },
  ];

  return (
    <div className={shared.stack}>
      <PageHeader
        title="Verifications"
        subtitle="Every trust report produced from the dashboard or through your API keys."
        actions={
          <CustomButton onClick={() => router.push("/verify")} leftIcon={<ScanSearch size={16} />}>
            Verify an image
          </CustomButton>
        }
      />

      <div className={shared.toolbar}>
        <div className={shared.filters}>
          <label>From (UTC)<input type="date" value={from} max={to || undefined} onChange={e => { setFrom(e.target.value); setPage(1); }} /></label>
          <label>Through (UTC)<input type="date" value={to} min={from || undefined} onChange={e => { setTo(e.target.value); setPage(1); }} /></label>
          <select
            className={shared.select}
            value={verdict}
            onChange={(e) => {
              setPage(1);
              setVerdict(e.target.value);
            }}
            aria-label="Filter by verdict"
          >
            <option value="">All verdicts</option>
            {Object.entries(VERDICTS).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>
          <select
            className={shared.select}
            value={match}
            onChange={(e) => {
              setPage(1);
              setMatch(e.target.value);
            }}
            aria-label="Filter by provenance match"
          >
            <option value="">All provenance</option>
            {Object.entries(MATCH_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <span className={shared.muted}>
          {total} verification{total === 1 ? "" : "s"}
        </span>
      </div>

      {!loading && items.length === 0 ? (
        <EmptyState
          icon={<ScanSearch size={22} />}
          title={verdict || match ? "No verifications match these filters" : "No verifications yet"}
          description={
            verdict || match
              ? "Try clearing the filters to see every report."
              : "Upload an image to get your first trust report, or call POST /verify with an API key."
          }
          action={<CustomButton onClick={() => router.push("/verify")}>Verify an image</CustomButton>}
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
          onRowClick={(row) => router.push(`/verifications/${encodeURIComponent(row.verificationId)}`)}
        />
      )}
    </div>
  );
}
