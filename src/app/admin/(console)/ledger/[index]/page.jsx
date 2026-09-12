"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Blocks, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader/PageHeader";
import SectionCard from "@/components/molecules/SectionCard/SectionCard";
import EmptyState from "@/components/molecules/EmptyState/EmptyState";
import CustomButton from "@/components/atoms/CustomButton/CustomButton";
import AppTable from "@/components/organisms/AppTable";
import { RenderGeneralTextCell } from "@/components/organisms/AppTable/tableHelper";
import KeyValueList from "@/components/molecules/KeyValueList/KeyValueList";
import HashChip from "@/components/molecules/HashChip/HashChip";
import CodeBlock from "@/components/molecules/CodeBlock/CodeBlock";
import { ToneBadge } from "@/components/molecules/ToneBadge/ToneBadge";
import useAxios from "@/interceptor/useAxios";
import { formatDateTime, formatNumber } from "@/resources/utils/helper";
import shared from "@/styles/shared.module.css";
import classes from "./page.module.css";

const CHECKS = [
  { key: "hashValid", label: "Block hash" },
  { key: "signatureValid", label: "Ed25519 signature" },
  { key: "difficultyMet", label: "Difficulty target" },
];

export default function AdminLedgerBlockPage() {
  const params = useParams();
  const router = useRouter();
  const rawIndex = Array.isArray(params?.index) ? params.index[0] : params?.index;
  const { Get } = useAxios();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [height, setHeight] = useState(null);

  const load = useCallback(async () => {
    if (rawIndex === undefined || rawIndex === null || rawIndex === "") return;
    setLoading(true);
    const [b, s] = await Promise.all([
      Get({ route: `ledger/blocks/${encodeURIComponent(rawIndex)}`, showAlert: false }),
      Get({ route: "ledger/stats", showAlert: false }),
    ]);
    setData(b.response?.data ?? null);
    setHeight(typeof s.response?.data?.height === "number" ? s.response.data.height : null);
    setLoading(false);
  }, [Get, rawIndex]);

  useEffect(() => {
    void load();
  }, [load]);

  const block = data?.block ?? null;
  const checks = data?.checks ?? {};
  const entries = Array.isArray(data?.entries) ? data.entries : [];
  const index = typeof block?.index === "number" ? block.index : Number(rawIndex);
  const hasIndex = Number.isInteger(index);
  const allOk = CHECKS.every((c) => checks[c.key] === true);

  const entryHeaders = [
    { key: "seq", title: "Seq", renderItem: ({ data: row }) => <span className={classes.index}>{row.seq}</span> },
    { key: "leafIndex", title: "Leaf", renderItem: ({ data: row }) => <code className={shared.mono}>{row.leafIndex}</code> },
    { key: "manifestId", title: "Manifest", renderItem: ({ data: row }) => <HashChip value={row.manifestId} head={24} /> },
    { key: "contentHash", title: "Content hash", renderItem: ({ data: row }) => <HashChip value={row.contentHash} /> },
    { key: "entryHash", title: "Entry hash", renderItem: ({ data: row }) => <HashChip value={row.entryHash} /> },
    { key: "prevEntryHash", title: "Prev entry hash", renderItem: ({ data: row }) => <HashChip value={row.prevEntryHash} /> },
    {
      key: "timestamp",
      title: "Recorded",
      renderItem: ({ data: row }) => <RenderGeneralTextCell text={formatDateTime(row.timestamp)} fontType="light" />,
    },
  ];

  return (
    <div className={shared.stack}>
      <PageHeader
        title={hasIndex ? `Block #${index}` : "Block"}
        subtitle={block ? `Sealed ${formatDateTime(block.timestamp)} · ${formatNumber(block.entryCount ?? 0)} entr${block.entryCount === 1 ? "y" : "ies"}` : "Block header, verification checks and entries."}
        backHref="/admin/ledger"
        breadcrumbs={[
          { label: "Ledger", href: "/admin/ledger" },
          { label: hasIndex ? `Block #${index}` : String(rawIndex ?? "") },
        ]}
        actions={
          hasIndex && (
            <div className={shared.rowActions}>
              <CustomButton
                variant="outline"
                disabled={index <= 0}
                onClick={() => router.push(`/admin/ledger/${index - 1}`)}
                leftIcon={<ChevronLeft size={16} />}
              >
                Previous
              </CustomButton>
              <CustomButton
                variant="outline"
                disabled={height !== null && index >= height}
                onClick={() => router.push(`/admin/ledger/${index + 1}`)}
                rightIcon={<ChevronRight size={16} />}
              >
                Next
              </CustomButton>
            </div>
          )
        }
      />

      {loading ? (
        <div className={shared.loaderRow}>
          <Loader2 className={shared.spin} />
        </div>
      ) : !block ? (
        <EmptyState
          icon={<Blocks size={22} />}
          title="Block not found"
          description="No block exists at this index or hash. The chain may not have grown this far yet."
          action={<CustomButton onClick={() => router.push("/admin/ledger")}>Back to explorer</CustomButton>}
        />
      ) : (
        <>
          <SectionCard
            title="Verification"
            description="Checks recomputed by the API when this block was fetched."
            actions={
              <ToneBadge tone={allOk ? "success" : "danger"} size="md" dot>
                {allOk ? "block valid" : "check failed"}
              </ToneBadge>
            }
          >
            <ul className={classes.checks}>
              {CHECKS.map((c) => {
                const value = checks[c.key];
                return (
                  <li key={c.key} className={classes.checkRow}>
                    <span>{c.label}</span>
                    <ToneBadge tone={value === true ? "success" : value === false ? "danger" : "neutral"}>
                      {value === true ? "✓ valid" : value === false ? "✕ invalid" : "n/a"}
                    </ToneBadge>
                  </li>
                );
              })}
            </ul>
          </SectionCard>

          <SectionCard title="Block header" description="Every field of the sealed block. Hashes shown in full.">
            <KeyValueList
              columns={2}
              dense
              items={[
                { label: "Index", value: `#${block.index}` },
                { label: "Sealed at", value: formatDateTime(block.timestamp) },
                { label: "Hash", value: <HashChip value={block.hash} full /> },
                { label: "Previous hash", value: <HashChip value={block.prevHash} full /> },
                { label: "Merkle root", value: <HashChip value={block.merkleRoot} full /> },
                { label: "Signature", value: <HashChip value={block.signature} full /> },
                { label: "Signer key id", value: <HashChip value={block.signerKeyId} full /> },
                { label: "Entries", value: formatNumber(block.entryCount ?? 0) },
                {
                  label: "Seq range",
                  value: block.entryCount > 0 ? `${block.firstSeq} – ${block.lastSeq}` : "—",
                  mono: true,
                },
                { label: "Difficulty", value: block.difficulty },
                { label: "Nonce", value: block.nonce, mono: true },
                { label: "Mining time", value: typeof block.miningMs === "number" ? `${block.miningMs} ms` : null },
                {
                  label: "Anchor",
                  value: block.anchor
                    ? typeof block.anchor === "string"
                      ? block.anchor
                      : JSON.stringify(block.anchor)
                    : null,
                  mono: true,
                },
              ]}
            />
          </SectionCard>

          <SectionCard
            title="Entries"
            description={`${formatNumber(entries.length)} manifest entr${entries.length === 1 ? "y" : "ies"} committed to this block's Merkle tree.`}
            padded={false}
          >
            <AppTable data={entries} tableHeader={entryHeaders} noDataText="This block holds no entries" />
          </SectionCard>

          <CodeBlock code={block} language="json" title={`block #${block.index}`} maxHeight={360} />
        </>
      )}
    </div>
  );
}
