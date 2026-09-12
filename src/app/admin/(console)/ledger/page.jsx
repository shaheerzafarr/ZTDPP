"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Blocks, CheckCircle2, Clock, Hammer, Layers, Lock, Search, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/molecules/PageHeader/PageHeader";
import { StatsCard } from "@/components/molecules/StatsCard/StatsCard";
import SectionCard from "@/components/molecules/SectionCard/SectionCard";
import CustomButton from "@/components/atoms/CustomButton/CustomButton";
import CustomInput from "@/components/atoms/CustomInput/CustomInput";
import AreYouSure from "@/components/organisms/AreYouSure/AreYouSure";
import AppTable from "@/components/organisms/AppTable";
import { RenderGeneralTextCell } from "@/components/organisms/AppTable/tableHelper";
import Tabs from "@/components/molecules/Tabs/Tabs";
import KeyValueList from "@/components/molecules/KeyValueList/KeyValueList";
import HashChip from "@/components/molecules/HashChip/HashChip";
import CodeBlock from "@/components/molecules/CodeBlock/CodeBlock";
import { StatusBadge, ToneBadge } from "@/components/molecules/ToneBadge/ToneBadge";
import useAxios from "@/interceptor/useAxios";
import { useDebounce } from "@/hooks/useDebounce";
import { extractItems, extractTotalRecords } from "@/resources/utils/apiResponse";
import { formatDateTime, formatNumber } from "@/resources/utils/helper";
import shared from "@/styles/shared.module.css";
import classes from "./page.module.css";

const LIMIT = 10;
const AUDIT_MAX_BLOCKS = 5000;

const TABS = [
  { value: "blocks", label: "Blocks" },
  { value: "entries", label: "Entries" },
];

export default function AdminLedgerPage() {
  const router = useRouter();
  const { Get, Post } = useAxios();

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [publicKey, setPublicKey] = useState(null);

  const [audit, setAudit] = useState(null);
  const [auditing, setAuditing] = useState(false);
  const [confirmSeal, setConfirmSeal] = useState(false);
  const [sealing, setSealing] = useState(false);

  const [tab, setTab] = useState("blocks");
  const [blocks, setBlocks] = useState({ items: [], total: 0, loading: true });
  const [blocksPage, setBlocksPage] = useState(1);
  const [entries, setEntries] = useState({ items: [], total: 0, loading: true });
  const [entriesPage, setEntriesPage] = useState(1);
  const [hashSearch, setHashSearch] = useState("");
  const debouncedHash = useDebounce(hashSearch.trim().toLowerCase(), 400);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    const { response } = await Get({ route: "ledger/stats", showAlert: false });
    setStats(response?.data ?? null);
    setStatsLoading(false);
  }, [Get]);

  const loadPublicKey = useCallback(async () => {
    const { response } = await Get({ route: "ledger/public-key", showAlert: false });
    setPublicKey(response?.data ?? null);
  }, [Get]);

  const loadBlocks = useCallback(async () => {
    setBlocks((prev) => ({ ...prev, loading: true }));
    const { response } = await Get({
      route: "ledger/blocks",
      params: { page: blocksPage, limit: LIMIT },
      showAlert: false,
    });
    setBlocks({ items: extractItems(response), total: extractTotalRecords(response), loading: false });
  }, [Get, blocksPage]);

  const loadEntries = useCallback(async () => {
    setEntries((prev) => ({ ...prev, loading: true }));
    const { response } = await Get({
      route: "ledger/entries",
      params: { page: entriesPage, limit: LIMIT, ...(debouncedHash ? { contentHash: debouncedHash } : {}) },
      showAlert: false,
    });
    setEntries({ items: extractItems(response), total: extractTotalRecords(response), loading: false });
  }, [Get, entriesPage, debouncedHash]);

  useEffect(() => {
    void loadStats();
    void loadPublicKey();
  }, [loadStats, loadPublicKey]);

  useEffect(() => {
    if (tab === "blocks") void loadBlocks();
  }, [tab, loadBlocks]);

  useEffect(() => {
    setEntriesPage(1);
  }, [debouncedHash]);

  useEffect(() => {
    if (tab === "entries") void loadEntries();
  }, [tab, loadEntries]);

  const runAudit = async () => {
    setAuditing(true);
    const { response } = await Get({ route: "admin/ledger/verify", params: { maxBlocks: AUDIT_MAX_BLOCKS } });
    if (response?.data) {
      setAudit(response.data);
      if (response.data.ok) toast.success("Ledger integrity verified");
      else toast.error(`Audit found ${response.data.issues?.length ?? 0} issue(s)`);
    }
    setAuditing(false);
  };

  const sealNow = async () => {
    setSealing(true);
    const { response } = await Post({ route: "admin/ledger/seal" });
    if (response?.data) {
      const { sealed, block } = response.data;
      if (sealed && block) {
        toast.success(`Block #${block.index} sealed with ${block.entryCount} entr${block.entryCount === 1 ? "y" : "ies"}`);
      } else {
        toast.info("No pending entries to seal");
      }
      await Promise.all([loadStats(), loadBlocks(), tab === "entries" ? loadEntries() : Promise.resolve()]);
    }
    setSealing(false);
    setConfirmSeal(false);
  };

  const blockHeaders = [
    { key: "index", title: "#", renderItem: ({ data }) => <span className={classes.index}>{data.index}</span> },
    { key: "hash", title: "Hash", renderItem: ({ data }) => <HashChip value={data.hash} /> },
    { key: "prevHash", title: "Prev hash", renderItem: ({ data }) => <HashChip value={data.prevHash} /> },
    { key: "merkleRoot", title: "Merkle root", renderItem: ({ data }) => <HashChip value={data.merkleRoot} /> },
    {
      key: "entryCount",
      title: "Entries",
      renderItem: ({ data }) => <RenderGeneralTextCell text={formatNumber(data.entryCount)} fontType="medium" />,
    },
    {
      key: "seq",
      title: "Seq range",
      renderItem: ({ data }) => (
        <code className={shared.mono}>
          {data.entryCount > 0 ? `${data.firstSeq}–${data.lastSeq}` : "—"}
        </code>
      ),
    },
    {
      key: "difficulty",
      title: "Difficulty / nonce",
      renderItem: ({ data }) => <code className={shared.mono}>{`${data.difficulty} / ${data.nonce}`}</code>,
    },
    {
      key: "miningMs",
      title: "Mining",
      renderItem: ({ data }) => (
        <RenderGeneralTextCell text={typeof data.miningMs === "number" ? `${data.miningMs} ms` : "—"} fontType="light" />
      ),
    },
    {
      key: "timestamp",
      title: "Sealed",
      renderItem: ({ data }) => <RenderGeneralTextCell text={formatDateTime(data.timestamp)} fontType="light" />,
    },
  ];

  const entryHeaders = [
    { key: "seq", title: "Seq", renderItem: ({ data }) => <span className={classes.index}>{data.seq}</span> },
    { key: "manifestId", title: "Manifest", renderItem: ({ data }) => <HashChip value={data.manifestId} head={24} /> },
    { key: "contentHash", title: "Content hash", renderItem: ({ data }) => <HashChip value={data.contentHash} /> },
    { key: "entryHash", title: "Entry hash", renderItem: ({ data }) => <HashChip value={data.entryHash} /> },
    { key: "status", title: "Status", renderItem: ({ data }) => <StatusBadge status={data.status} /> },
    {
      key: "blockIndex",
      title: "Block",
      renderItem: ({ data }) =>
        data.blockIndex !== null && data.blockIndex !== undefined ? (
          <button
            type="button"
            className={shared.linkButton}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/ledger/${data.blockIndex}`);
            }}
          >
            #{data.blockIndex}
          </button>
        ) : (
          <span className={shared.muted}>pending</span>
        ),
    },
    {
      key: "timestamp",
      title: "Recorded",
      renderItem: ({ data }) => <RenderGeneralTextCell text={formatDateTime(data.timestamp)} fontType="light" />,
    },
  ];

  const issueHeaders = [
    { key: "blockIndex", title: "Block", renderItem: ({ data }) => <code className={shared.mono}>{data.blockIndex ?? "—"}</code> },
    { key: "seq", title: "Seq", renderItem: ({ data }) => <code className={shared.mono}>{data.seq ?? "—"}</code> },
    { key: "code", title: "Code", renderItem: ({ data }) => <ToneBadge tone="danger">{data.code}</ToneBadge> },
    { key: "message", title: "Message", renderItem: ({ data }) => <RenderGeneralTextCell text={data.message} fontType="regular" /> },
  ];

  return (
    <div className={shared.stack}>
      <PageHeader
        title="Ledger explorer"
        subtitle="Append-only, Ed25519-signed hash chain anchoring every manifest."
        actions={
          <div className={shared.rowActions}>
            <CustomButton variant="outline" onClick={runAudit} loading={auditing} leftIcon={<ShieldCheck size={16} />}>
              Run integrity audit
            </CustomButton>
            <CustomButton
              onClick={() => setConfirmSeal(true)}
              disabled={sealing || Boolean(stats && stats.pendingEntries === 0)}
              leftIcon={<Hammer size={16} />}
            >
              Seal pending now
            </CustomButton>
          </div>
        }
      />

      <div className={shared.statsGrid}>
        <StatsCard icon={<Blocks />} label="Chain height" value={statsLoading ? "…" : formatNumber(stats?.height ?? 0)} />
        <StatsCard icon={<Layers />} label="Total entries" value={statsLoading ? "…" : formatNumber(stats?.totalEntries ?? 0)} />
        <StatsCard icon={<Clock />} label="Pending" value={statsLoading ? "…" : formatNumber(stats?.pendingEntries ?? 0)} />
        <StatsCard icon={<Lock />} label="Sealed" value={statsLoading ? "…" : formatNumber(stats?.sealedEntries ?? 0)} />
      </div>

      {stats && (
        <SectionCard title="Chain configuration">
          {stats.ephemeralKey && (
            <div className={classes.warning}>
              <AlertTriangle size={18} />
              <span>
                Ephemeral signing key — blocks sealed now will not verify after a restart. Run{" "}
                <code>npm run keys:generate</code> on the API server and restart it.
              </span>
            </div>
          )}
          <KeyValueList
            columns={3}
            dense
            items={[
              { label: "Difficulty", value: stats.config?.difficulty },
              { label: "Block size", value: stats.config?.blockSize ? `${stats.config.blockSize} entries` : null },
              {
                label: "Seal interval",
                value: stats.config?.blockIntervalSeconds ? `${stats.config.blockIntervalSeconds} s` : null,
              },
              {
                label: "Signer key id",
                value: (
                  <span className={classes.inline}>
                    <HashChip value={stats.signerKeyId} head={12} tail={6} />
                    {stats.ephemeralKey && (
                      <ToneBadge tone="warning" dot>
                        ephemeral
                      </ToneBadge>
                    )}
                  </span>
                ),
              },
              { label: "Total blocks", value: formatNumber(stats.totalBlocks ?? 0) },
              {
                label: "Last block",
                value: stats.lastBlock ? (
                  <span className={classes.inline}>
                    <span className={classes.index}>#{stats.lastBlock.index}</span>
                    <HashChip value={stats.lastBlock.hash} />
                    <span className={shared.muted}>{formatDateTime(stats.lastBlock.timestamp)}</span>
                  </span>
                ) : null,
              },
            ]}
          />
        </SectionCard>
      )}

      {audit && (
        <SectionCard
          title="Integrity audit"
          description={`Checked ${formatNumber(audit.checkedBlocks ?? 0)} block(s) and ${formatNumber(audit.checkedEntries ?? 0)} entr(ies) in ${audit.durationMs ?? 0} ms.`}
          actions={
            <ToneBadge tone={audit.ok ? "success" : "danger"} size="md" dot>
              {audit.ok ? "chain intact" : "issues found"}
            </ToneBadge>
          }
        >
          <div className={classes.auditGrid}>
            <AuditStat icon={audit.ok ? <CheckCircle2 size={18} /> : <XCircle size={18} />} label="Result" value={audit.ok ? "OK" : "FAILED"} tone={audit.ok ? "success" : "danger"} />
            <AuditStat label="Blocks checked" value={formatNumber(audit.checkedBlocks ?? 0)} />
            <AuditStat label="Entries checked" value={formatNumber(audit.checkedEntries ?? 0)} />
            <AuditStat label="Duration" value={`${audit.durationMs ?? 0} ms`} />
            <AuditStat label="Height" value={formatNumber(audit.height ?? 0)} />
            <AuditStat label="Pending entries" value={formatNumber(audit.pendingEntries ?? 0)} />
          </div>
          {Array.isArray(audit.issues) && audit.issues.length > 0 ? (
            <div className={classes.issues}>
              <AppTable data={audit.issues} tableHeader={issueHeaders} noDataText="No issues" />
            </div>
          ) : (
            <p className={classes.auditOk}>
              <CheckCircle2 size={16} /> Every block hash, signature, Merkle root and entry link verified.
            </p>
          )}
        </SectionCard>
      )}

      <SectionCard padded={false}>
        <div className={classes.tabsBar}>
          <Tabs tabs={TABS} activeTab={tab} onTabChange={setTab} variant="underline" />
          {tab === "entries" && (
            <div className={classes.hashSearch}>
              <CustomInput
                value={hashSearch}
                setValue={setHashSearch}
                placeholder="Filter by exact content hash (sha256)…"
                leftIcon={<Search size={16} />}
                maxLength={64}
              />
            </div>
          )}
        </div>

        {tab === "blocks" ? (
          <AppTable
            data={blocks.items}
            tableHeader={blockHeaders}
            loading={blocks.loading}
            page={blocksPage}
            totalRecords={blocks.total}
            limitPerPage={LIMIT}
            onPageChange={setBlocksPage}
            onRowClick={(row) => router.push(`/admin/ledger/${row.index}`)}
            noDataText="No blocks sealed yet"
          />
        ) : (
          <AppTable
            data={entries.items}
            tableHeader={entryHeaders}
            loading={entries.loading}
            page={entriesPage}
            totalRecords={entries.total}
            limitPerPage={LIMIT}
            onPageChange={setEntriesPage}
            noDataText={debouncedHash ? "No entry with that content hash" : "No ledger entries yet"}
          />
        )}
      </SectionCard>

      <SectionCard
        title="Signer public key"
        description="Anyone can verify block and manifest signatures with this key."
        actions={publicKey?.alg && <ToneBadge tone="neutral">{publicKey.alg}</ToneBadge>}
      >
        {publicKey?.pem ? (
          <CodeBlock code={publicKey.pem} language="pem" title="public key" maxHeight={200} />
        ) : (
          <p className={shared.muted}>Public key unavailable.</p>
        )}
      </SectionCard>

      <AreYouSure
        show={confirmSeal}
        setShow={setConfirmSeal}
        loading={sealing}
        text="Seal pending entries now?"
        message={`${formatNumber(stats?.pendingEntries ?? 0)} pending entr${(stats?.pendingEntries ?? 0) === 1 ? "y" : "ies"} will be mined into a new block immediately instead of waiting for the next scheduled seal.`}
        buttonText="Seal now"
        handleConfirm={sealNow}
      />
    </div>
  );
}

function AuditStat({ icon, label, value, tone }) {
  return (
    <div className={classes.auditStat} data-tone={tone}>
      <span className={classes.auditLabel}>{label}</span>
      <span className={classes.auditValue}>
        {icon}
        {value}
      </span>
    </div>
  );
}
