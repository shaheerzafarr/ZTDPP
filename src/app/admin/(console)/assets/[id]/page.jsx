"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Boxes, Loader2, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader/PageHeader";
import SectionCard from "@/components/molecules/SectionCard/SectionCard";
import EmptyState from "@/components/molecules/EmptyState/EmptyState";
import CustomButton from "@/components/atoms/CustomButton/CustomButton";
import KeyValueList from "@/components/molecules/KeyValueList/KeyValueList";
import HashChip from "@/components/molecules/HashChip/HashChip";
import CodeBlock from "@/components/molecules/CodeBlock/CodeBlock";
import { OriginBadge, StatusBadge, ToneBadge } from "@/components/molecules/ToneBadge/ToneBadge";
import ProvenanceTimeline from "@/components/organisms/ProvenanceTimeline/ProvenanceTimeline";
import useAxios from "@/interceptor/useAxios";
import { formatDateTime, formatNumber, getDisplayName, shortId, titleCase } from "@/resources/utils/helper";
import shared from "@/styles/shared.module.css";
import classes from "./page.module.css";

const safeDecode = (value) => {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export default function AdminAssetDetailPage() {
  const params = useParams();
  const assetId = safeDecode(Array.isArray(params?.id) ? params.id[0] : params?.id);
  const { Get } = useAxios();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState(null);
  const [proof, setProof] = useState(null);
  const [proofLoading, setProofLoading] = useState(false);

  const load = useCallback(async () => {
    if (!assetId) return;
    setLoading(true);
    setProof(null);
    const { response } = await Get({ route: `admin/assets/${encodeURIComponent(assetId)}/history`, showAlert: false });
    const data = response?.data ?? null;
    setHistory(data);
    setLoading(false);

    const timeline = Array.isArray(data?.timeline) ? data.timeline : [];
    const latest = timeline[timeline.length - 1];
    if (latest?.manifestId) {
      setProofLoading(true);
      const p = await Get({ route: `ledger/proof/${encodeURIComponent(latest.manifestId)}`, showAlert: false });
      setProof(p.response?.data ?? null);
      setProofLoading(false);
    }
  }, [Get, assetId]);

  useEffect(() => {
    void load();
  }, [load]);

  const asset = history?.asset ?? null;
  const timeline = Array.isArray(history?.timeline) ? history.timeline : [];
  const latest = timeline[timeline.length - 1] ?? null;
  const title = asset?.title || asset?.externalId || shortId(asset?.assetId ?? assetId, 12);

  return (
    <div className={shared.stack}>
      <PageHeader
        title={loading ? "Asset" : title}
        subtitle={asset ? `${asset.versionCount ?? timeline.length} version${(asset.versionCount ?? timeline.length) === 1 ? "" : "s"} · registered ${formatDateTime(asset.createdAt)}` : "Asset lineage and ledger proof."}
        backHref="/admin/assets"
        breadcrumbs={[
          { label: "Assets", href: "/admin/assets" },
          { label: shortId(assetId, 12) },
        ]}
        actions={
          !loading && (
            <CustomButton variant="outline" onClick={load} leftIcon={<RefreshCw size={16} />}>
              Refresh
            </CustomButton>
          )
        }
      />

      {loading ? (
        <div className={shared.loaderRow}>
          <Loader2 className={shared.spin} />
        </div>
      ) : !asset ? (
        <EmptyState
          icon={<Boxes size={22} />}
          title="Asset not found"
          description="No asset or manifest matches this identifier."
          action={<CustomButton onClick={load}>Retry</CustomButton>}
        />
      ) : (
        <>
          <SectionCard title="Asset" description="Registry record for this asset. Hashes are copyable.">
            <KeyValueList
              columns={3}
              dense
              items={[
                { label: "Asset id", value: <HashChip value={asset.assetId} head={18} tail={10} /> },
                { label: "Title", value: asset.title },
                { label: "External id", value: asset.externalId, mono: true },
                { label: "Owner", value: <OwnerValue owner={asset.owner} /> },
                {
                  label: "API key",
                  value:
                    asset.apiKey && typeof asset.apiKey === "object"
                      ? `${asset.apiKey.name}${asset.apiKey.masked ? ` · ${asset.apiKey.masked}` : ""}`
                      : asset.apiKey
                        ? shortId(asset.apiKey)
                        : "dashboard",
                },
                { label: "Status", value: <StatusBadge status={asset.status} /> },
                { label: "Root origin", value: <OriginBadge origin={asset.rootOriginType} /> },
                { label: "Current origin", value: <OriginBadge origin={asset.currentOriginType} /> },
                { label: "MIME type", value: asset.mimeType, mono: true },
                { label: "Versions", value: formatNumber(asset.versionCount ?? timeline.length) },
                { label: "Verifications", value: formatNumber(asset.verificationCount ?? 0) },
                { label: "Origin label", value: asset.originLabel },
                { label: "Root content hash", value: <HashChip value={asset.rootContentHash} /> },
                { label: "Latest content hash", value: <HashChip value={asset.latestContentHash} /> },
                {
                  label: "Current manifest",
                  value: (
                    <HashChip
                      value={typeof asset.currentManifest === "object" ? asset.currentManifest?.manifestId : asset.currentManifest}
                      head={22}
                      tail={8}
                    />
                  ),
                },
                { label: "Created", value: formatDateTime(asset.createdAt) },
                { label: "Updated", value: formatDateTime(asset.updatedAt) },
              ]}
            />
          </SectionCard>

          <div className={shared.twoCol}>
            <SectionCard title="Provenance timeline" description="Every manifest version, oldest first.">
              {timeline.length === 0 ? (
                <p className={shared.muted}>No manifests recorded for this asset.</p>
              ) : (
                <ProvenanceTimeline manifests={timeline} highlightManifestId={latest?.manifestId} />
              )}
            </SectionCard>

            <div className={classes.column}>
              <SectionCard
                title="Ledger proof"
                description={latest ? `Merkle inclusion proof for v${latest.version} (${shortId(latest.manifestId, 10)}).` : "Latest manifest inclusion proof."}
              >
                {proofLoading ? (
                  <div className={shared.loaderRow}>
                    <Loader2 className={shared.spin} />
                  </div>
                ) : !latest ? (
                  <p className={shared.muted}>No manifest to prove.</p>
                ) : !proof ? (
                  <p className={shared.muted}>
                    No ledger proof is available yet. The latest entry is{" "}
                    {latest.ledger?.status ? <StatusBadge status={latest.ledger.status} /> : "not yet anchored"} — proofs
                    are issued once the entry is sealed into a block.
                  </p>
                ) : (
                  <ProofPanel proof={proof} />
                )}
              </SectionCard>

              {latest && (
                <CodeBlock code={latest} language="json" title={`manifest v${latest.version}`} maxHeight={420} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function OwnerValue({ owner }) {
  if (!owner) return null;
  if (typeof owner === "object") {
    return (
      <span>
        {getDisplayName(owner)}
        {owner.email && <span className={classes.sub}> · {owner.email}</span>}
      </span>
    );
  }
  return <HashChip value={owner} head={10} tail={6} />;
}

function ProofPanel({ proof }) {
  const entry = proof.entry ?? {};
  const block = proof.block ?? null;
  const verification = proof.verification ?? {};
  const checks = verification.checks && typeof verification.checks === "object" ? verification.checks : {};
  const checkEntries = Object.entries(checks);

  return (
    <div className={classes.proof}>
      <div className={classes.proofHead}>
        <ToneBadge tone={verification.ok === true ? "success" : verification.ok === false ? "danger" : "neutral"} dot size="md">
          {verification.ok === true ? "proof verified" : verification.ok === false ? "proof failed" : "unverified"}
        </ToneBadge>
        {entry.status && <StatusBadge status={entry.status} />}
      </div>

      <KeyValueList
        columns={2}
        dense
        items={[
          { label: "Entry seq", value: entry.seq !== undefined ? `#${entry.seq}` : null },
          { label: "Leaf index", value: entry.leafIndex },
          { label: "Entry hash", value: <HashChip value={entry.entryHash} /> },
          { label: "Sealed at", value: entry.sealedAt ? formatDateTime(entry.sealedAt) : null },
          { label: "Block", value: block?.index !== undefined ? `#${block.index}` : entry.blockIndex !== undefined && entry.blockIndex !== null ? `#${entry.blockIndex}` : null },
          { label: "Block hash", value: <HashChip value={block?.hash ?? entry.blockHash} /> },
          { label: "Merkle root", value: block?.merkleRoot ? <HashChip value={block.merkleRoot} /> : null },
          { label: "Block sealed", value: block?.timestamp ? formatDateTime(block.timestamp) : null },
        ]}
      />

      {checkEntries.length > 0 && (
        <ul className={classes.checks}>
          {checkEntries.map(([key, value]) => (
            <li key={key} className={classes.checkRow}>
              <span>{titleCase(key)}</span>
              <ToneBadge tone={value === true ? "success" : value === false ? "danger" : "neutral"}>
                {value === true ? "✓" : value === false ? "✕" : String(value)}
              </ToneBadge>
            </li>
          ))}
        </ul>
      )}

      <CodeBlock
        code={{ proof: entry.proof ?? [], leafIndex: entry.leafIndex, merkleRoot: block?.merkleRoot ?? null }}
        language="json"
        title="merkle proof"
        maxHeight={260}
      />
    </div>
  );
}
