"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Boxes, GitBranchPlus, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader/PageHeader";
import SectionCard from "@/components/molecules/SectionCard/SectionCard";
import EmptyState from "@/components/molecules/EmptyState/EmptyState";
import CustomButton from "@/components/atoms/CustomButton/CustomButton";
import KeyValueList from "@/components/molecules/KeyValueList/KeyValueList";
import CodeBlock from "@/components/molecules/CodeBlock/CodeBlock";
import HashChip from "@/components/molecules/HashChip/HashChip";
import { OriginBadge, StatusBadge, ToneBadge } from "@/components/molecules/ToneBadge/ToneBadge";
import ProvenanceTimeline from "@/components/organisms/ProvenanceTimeline/ProvenanceTimeline";
import RegisterAssetModal from "@/components/organisms/RegisterAssetModal/RegisterAssetModal";
import useAxios from "@/interceptor/useAxios";
import { ORIGINS } from "@/resources/constants/ztdpp";
import { formatDateTime, formatNumber, shortId } from "@/resources/utils/helper";
import shared from "@/styles/shared.module.css";
import classes from "./page.module.css";

const CHECK_ROWS = [
  ["entryHashValid", "Entry hash valid"],
  ["chainLinkValid", "Chain link valid"],
  ["merkleProofValid", "Merkle proof valid"],
  ["blockHashValid", "Block hash valid"],
  ["blockSignatureValid", "Block signature valid"],
  ["difficultyMet", "Difficulty met"],
];

const safeDecode = (value) => {
  if (typeof value !== "string") return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { Get } = useAxios();
  const id = safeDecode(params?.id);

  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [proof, setProof] = useState(null);
  const [proofLoading, setProofLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { response } = await Get({ route: `assets/${encodeURIComponent(id)}/history`, showAlert: false });
    const data = response?.data ?? null;
    setAsset(data?.asset ?? null);
    setTimeline(Array.isArray(data?.timeline) ? data.timeline : []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const latest = useMemo(() => (timeline.length ? timeline[timeline.length - 1] : null), [timeline]);

  useEffect(() => {
    const manifestId = latest?.manifestId;
    if (!manifestId) {
      setProof(null);
      return;
    }
    let cancelled = false;
    const loadProof = async () => {
      setProofLoading(true);
      // 404 while the entry is still pending / not yet written; treat as "not anchored".
      const { response } = await Get({ route: `ledger/proof/${encodeURIComponent(manifestId)}`, showAlert: false });
      if (!cancelled) {
        setProof(response?.data ?? null);
        setProofLoading(false);
      }
    };
    void loadProof();
    return () => {
      cancelled = true;
    };
  }, [latest?.manifestId]);

  const displayName = asset?.title || asset?.externalId || shortId(asset?.assetId, 12);
  const registeredVia =
    asset?.registeredVia ??
    (asset?.apiKey && typeof asset.apiKey === "object"
      ? `API key: ${asset.apiKey.name ?? ""}`.trim()
      : asset?.apiKey
        ? "API key"
        : "Dashboard");

  if (loading) {
    return (
      <div className={shared.stack}>
        <PageHeader backHref="/assets" title="Asset" subtitle={id} />
        <div className={shared.loaderRow}>
          <Loader2 size={22} className={shared.spin} />
          <span className={classes.loaderText}>Loading asset…</span>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className={shared.stack}>
        <PageHeader backHref="/assets" title="Asset" subtitle={id} />
        <EmptyState
          icon={<Boxes size={22} />}
          title="Asset not found"
          description="This asset does not exist or belongs to a different platform."
          action={<CustomButton onClick={() => router.push("/assets")}>Back to assets</CustomButton>}
        />
      </div>
    );
  }

  const entry = proof?.entry ?? null;
  const checks = proof?.verification?.checks ?? null;

  return (
    <div className={shared.stack}>
      <PageHeader
        backHref="/assets"
        title={displayName}
        subtitle={asset.originLabel ?? ORIGINS[asset.currentOriginType]?.label ?? "Registered asset"}
        actions={
          <CustomButton onClick={() => setShowEdit(true)} leftIcon={<GitBranchPlus size={16} />} disabled={!latest}>
            Register edited version
          </CustomButton>
        }
      />

      <SectionCard title="Overview">
        <KeyValueList
          columns={3}
          dense
          items={[
            { label: "Asset id", value: <HashChip value={asset.assetId} head={18} tail={10} /> },
            { label: "External id", value: asset.externalId },
            { label: "MIME type", value: asset.mimeType },
            { label: "Root origin", value: <OriginBadge origin={asset.rootOriginType} /> },
            { label: "Current origin", value: <OriginBadge origin={asset.currentOriginType} /> },
            { label: "Versions", value: formatNumber(asset.versionCount ?? timeline.length) },
            { label: "Verifications", value: formatNumber(asset.verificationCount ?? 0) },
            { label: "Registered via", value: registeredVia },
            { label: "Created", value: formatDateTime(asset.createdAt) },
            { label: "Root hash", value: <HashChip value={asset.rootContentHash} /> },
            { label: "Latest hash", value: <HashChip value={asset.latestContentHash} /> },
            { label: "Status", value: asset.status ? <StatusBadge status={asset.status} /> : null },
          ]}
        />
      </SectionCard>

      <SectionCard
        title="Version history"
        description="Every manifest in this asset's lineage, oldest first. Each version is signed and anchored independently."
      >
        {timeline.length ? (
          <ProvenanceTimeline manifests={timeline} highlightManifestId={latest?.manifestId} linkBase="/assets/manifest" />
        ) : (
          <p className={shared.muted}>No manifests recorded for this asset.</p>
        )}
      </SectionCard>

      <SectionCard
        title="Ledger"
        description={
          latest
            ? `Inclusion proof for the current manifest (v${latest.version}) in the ZTD ledger.`
            : "No manifest available."
        }
        actions={
          proof?.verification ? (
            <ToneBadge tone={proof.verification.ok ? "success" : "danger"} dot>
              {proof.verification.ok ? "proof verified" : "proof failed"}
            </ToneBadge>
          ) : null
        }
      >
        {proofLoading ? (
          <div className={shared.loaderRow}>
            <Loader2 size={20} className={shared.spin} />
            <span className={classes.loaderText}>Fetching proof…</span>
          </div>
        ) : !entry ? (
          <p className={shared.muted}>
            This manifest has not been written to the ledger yet. Entries are appended immediately after signing and
            sealed into a block on the next interval; refresh in a moment.
          </p>
        ) : (
          <div className={classes.ledger}>
            <KeyValueList
              columns={3}
              dense
              items={[
                { label: "Entry seq", value: `#${entry.seq}` },
                { label: "Status", value: <StatusBadge status={entry.status} /> },
                { label: "Block index", value: entry.blockIndex ?? "pending" },
                { label: "Block hash", value: <HashChip value={entry.blockHash} /> },
                { label: "Entry hash", value: <HashChip value={entry.entryHash} /> },
                { label: "Leaf index", value: entry.leafIndex ?? "—" },
                { label: "Sealed at", value: entry.sealedAt ? formatDateTime(entry.sealedAt) : "—" },
                { label: "Merkle root", value: <HashChip value={proof.block?.merkleRoot} /> },
                { label: "Signer key", value: proof.block?.signerKeyId, mono: true },
              ]}
            />

            {checks && (
              <ul className={classes.checkRows}>
                {CHECK_ROWS.map(([key, label]) => (
                  <li key={key}>
                    <span>{label}</span>
                    <span className={classes.checkValue}>{renderCheck(checks[key])}</span>
                  </li>
                ))}
              </ul>
            )}

            {entry.status === "pending" && (
              <p className={shared.muted}>
                The entry is chained (entry hash + previous hash) but not yet sealed into a block. Merkle and block checks
                become available after the next seal.
              </p>
            )}

            <CodeBlock
              title="merkle proof"
              language="json"
              maxHeight={320}
              code={{
                leaf: entry.entryHash,
                leafIndex: entry.leafIndex,
                proof: entry.proof ?? [],
                merkleRoot: proof.block?.merkleRoot ?? null,
                blockIndex: entry.blockIndex,
              }}
            />
          </div>
        )}
      </SectionCard>

      <RegisterAssetModal
        show={showEdit}
        setShow={setShowEdit}
        defaultParentManifestId={latest?.manifestId}
        onRegistered={() => void load()}
      />
    </div>
  );
}

function renderCheck(value) {
  if (value === true) return <span className={classes.ok}>✓</span>;
  if (value === false) return <span className={classes.bad}>✕</span>;
  return "—";
}
