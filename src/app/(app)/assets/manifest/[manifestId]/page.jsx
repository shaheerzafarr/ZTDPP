"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FileQuestion, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader/PageHeader";
import SectionCard from "@/components/molecules/SectionCard/SectionCard";
import EmptyState from "@/components/molecules/EmptyState/EmptyState";
import CustomButton from "@/components/atoms/CustomButton/CustomButton";
import KeyValueList from "@/components/molecules/KeyValueList/KeyValueList";
import CodeBlock from "@/components/molecules/CodeBlock/CodeBlock";
import HashChip from "@/components/molecules/HashChip/HashChip";
import { OriginBadge, StatusBadge, ToneBadge } from "@/components/molecules/ToneBadge/ToneBadge";
import useAxios from "@/interceptor/useAxios";
import { ACTION_LABELS, ORIGINS } from "@/resources/constants/ztdpp";
import { formatBytes, formatDateTime, shortHash, titleCase } from "@/resources/utils/helper";
import shared from "@/styles/shared.module.css";
import classes from "./page.module.css";

const safeDecode = (value) => {
  if (typeof value !== "string") return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export default function ManifestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { Get } = useAxios();
  const manifestId = safeDecode(params?.manifestId);

  const [loading, setLoading] = useState(true);
  const [manifest, setManifest] = useState(null);

  const load = useCallback(async () => {
    if (!manifestId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { response } = await Get({ route: `assets/manifest/${encodeURIComponent(manifestId)}`, showAlert: false });
    setManifest(response?.data ?? null);
    setLoading(false);
  }, [manifestId]);

  useEffect(() => {
    void load();
  }, [load]);

  const backHref = manifest?.assetId ? `/assets/${encodeURIComponent(manifest.assetId)}` : "/assets";

  if (loading) {
    return (
      <div className={shared.stack}>
        <PageHeader backHref="/assets" title="Manifest" subtitle={manifestId} />
        <div className={shared.loaderRow}>
          <Loader2 size={22} className={shared.spin} />
          <span className={classes.loaderText}>Loading manifest…</span>
        </div>
      </div>
    );
  }

  if (!manifest) {
    return (
      <div className={shared.stack}>
        <PageHeader backHref="/assets" title="Manifest" subtitle={manifestId} />
        <EmptyState
          icon={<FileQuestion size={22} />}
          title="Manifest not found"
          description="This manifest does not exist or belongs to a different platform."
          action={<CustomButton onClick={() => router.push("/assets")}>Back to assets</CustomButton>}
        />
      </div>
    );
  }

  const signature = manifest.signature ?? null;
  const ledger = manifest.ledger ?? null;
  const claim = manifest.claimGenerator ?? null;
  const embedded = manifest.embeddedMetadata ?? null;
  const actions = Array.isArray(manifest.actions) ? manifest.actions : [];
  const assertions = Array.isArray(manifest.assertions) ? manifest.assertions : [];

  return (
    <div className={shared.stack}>
      <PageHeader
        backHref={backHref}
        title={`Manifest v${manifest.version ?? 1}`}
        subtitle={manifest.manifestId}
        actions={
          <div className={classes.headerBadges}>
            <OriginBadge origin={manifest.originType} size="md" />
            {ledger?.status && <StatusBadge status={ledger.status} size="md" />}
            {manifest.hashOnly && <ToneBadge tone="neutral" size="md">hash-only</ToneBadge>}
          </div>
        }
      />

      <SectionCard title="Manifest" description="Signed provenance record. Fields below are exactly what the signature covers.">
        <KeyValueList
          columns={3}
          dense
          items={[
            { label: "Manifest id", value: <HashChip value={manifest.manifestId} head={22} tail={10} /> },
            {
              label: "Asset",
              value: manifest.assetId ? (
                <Link href={backHref} className={shared.linkButton}>
                  {shortHash(manifest.assetId, 18, 10)}
                </Link>
              ) : null,
            },
            { label: "Version", value: `v${manifest.version ?? 1}` },
            {
              label: "Parent manifest",
              value: manifest.parentManifestId ? (
                <Link
                  href={`/assets/manifest/${encodeURIComponent(manifest.parentManifestId)}`}
                  className={shared.linkButton}
                >
                  {shortHash(manifest.parentManifestId, 22, 10)}
                </Link>
              ) : (
                "— (root)"
              ),
            },
            { label: "Parent content hash", value: <HashChip value={manifest.parentContentHash} />, hidden: !manifest.parentContentHash },
            { label: "Origin", value: manifest.originLabel ?? ORIGINS[manifest.originType]?.label },
            { label: "Declared source", value: titleCase(manifest.declaredSourceType ?? "") || null },
            {
              label: "Claim generator",
              value: claim ? `${claim.name ?? "—"}${claim.platform ? ` · ${claim.platform}` : ""}${claim.keyPrefix ? ` · ${claim.keyPrefix}` : ""}` : null,
            },
            { label: "Registered", value: formatDateTime(manifest.registeredAt) },
            { label: "MIME type", value: manifest.mimeType },
            { label: "Dimensions", value: manifest.width ? `${manifest.width} × ${manifest.height}` : null },
            { label: "Size", value: typeof manifest.fileSize === "number" ? formatBytes(manifest.fileSize) : null },
            { label: "Hash-only", value: manifest.hashOnly ? "yes" : "no" },
            { label: "Status", value: manifest.status ? <StatusBadge status={manifest.status} /> : null },
          ]}
        />
      </SectionCard>

      <div className={shared.twoCol}>
        <SectionCard title="Fingerprints" description="SHA-256 of the content bytes plus perceptual hashes for near-duplicate matching.">
          <div className={classes.hashList}>
            <HashChip label="sha256" value={manifest.contentHash} full />
            <HashChip label="phash" value={manifest.phash} full />
            <HashChip label="dhash" value={manifest.dhash} full />
            <HashChip label="manifest" value={manifest.manifestHash} full />
          </div>
        </SectionCard>

        <div className={classes.sideStack}>
          <SectionCard title="Signature">
            {signature ? (
              <KeyValueList
                dense
                items={[
                  { label: "Algorithm", value: signature.alg, mono: true },
                  { label: "Key id", value: signature.keyId, mono: true },
                  { label: "Value", value: <HashChip value={signature.value} head={16} tail={12} /> },
                  { label: "Signed at", value: formatDateTime(signature.signedAt) },
                ]}
              />
            ) : (
              <p className={shared.muted}>Unsigned.</p>
            )}
          </SectionCard>

          <SectionCard title="Ledger">
            {ledger ? (
              <KeyValueList
                dense
                items={[
                  { label: "Status", value: <StatusBadge status={ledger.status} /> },
                  { label: "Entry seq", value: ledger.seq !== null && ledger.seq !== undefined ? `#${ledger.seq}` : null },
                  { label: "Entry hash", value: <HashChip value={ledger.entryHash} /> },
                  { label: "Block index", value: ledger.blockIndex ?? "pending" },
                  { label: "Block hash", value: <HashChip value={ledger.blockHash} /> },
                ]}
              />
            ) : (
              <p className={shared.muted}>Not yet written to the ledger.</p>
            )}
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Actions" description="C2PA-aligned actions declared for this version.">
        {actions.length ? (
          <ul className={classes.actionList}>
            {actions.map((a, i) => (
              <li key={`${a.action}-${i}`} className={classes.actionItem}>
                <div className={classes.actionHead}>
                  <span className={classes.actionLabel}>{ACTION_LABELS[a.action] ?? a.action}</span>
                  <code className={shared.mono}>{a.action}</code>
                </div>
                <div className={classes.actionMeta}>
                  {a.softwareAgent && <span>{a.softwareAgent}</span>}
                  {a.when && <span>{formatDateTime(a.when)}</span>}
                  {a.digitalSourceType && <span>{a.digitalSourceType}</span>}
                  {a.description && <span>{a.description}</span>}
                </div>
                {a.parameters && Object.keys(a.parameters).length > 0 && (
                  <CodeBlock code={a.parameters} language="json" title="parameters" maxHeight={200} />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className={shared.muted}>No actions declared.</p>
        )}
      </SectionCard>

      <SectionCard title="Assertions" description="Structured claims bundled with the manifest and covered by the signature.">
        {assertions.length ? (
          <div className={classes.assertionList}>
            {assertions.map((a, i) => (
              <CodeBlock key={`${a.label}-${i}`} code={a.data ?? {}} language="json" title={a.label} maxHeight={260} />
            ))}
          </div>
        ) : (
          <p className={shared.muted}>No assertions.</p>
        )}
      </SectionCard>

      <SectionCard title="Embedded metadata" description="Extracted from the file at registration time. GPS coordinates are never stored.">
        {embedded ? (
          <KeyValueList
            columns={3}
            dense
            items={[
              { label: "Format", value: embedded.format },
              { label: "C2PA container", value: embedded.c2pa?.containerPresent ? `present (${embedded.c2pa.format ?? "unknown"})` : "absent" },
              { label: "EXIF present", value: embedded.exif?.present ? "yes" : "no" },
              { label: "Make / model", value: embedded.exif?.make ? `${embedded.exif.make} ${embedded.exif.model ?? ""}`.trim() : null },
              { label: "Software", value: embedded.exif?.software },
              { label: "Captured", value: embedded.exif?.dateTimeOriginal ? formatDateTime(embedded.exif.dateTimeOriginal) : null },
              { label: "Lens", value: embedded.exif?.lensModel },
              { label: "GPS", value: embedded.exif?.hasGps ? "present (not stored)" : "absent" },
              { label: "XMP creator tool", value: embedded.xmp?.creatorTool },
              { label: "Digital source type", value: embedded.xmp?.digitalSourceType ?? embedded.iptc?.digitalSourceType },
              {
                label: "AI generator hints",
                value: embedded.aiHints?.detected ? (embedded.aiHints.indicators ?? []).join(", ") : "none",
              },
              {
                label: "XMP history",
                value: embedded.xmp?.history?.length ? `${embedded.xmp.history.length} step(s)` : null,
              },
            ]}
          />
        ) : (
          <p className={shared.muted}>No embedded metadata (hash-only registration).</p>
        )}
      </SectionCard>

      <CodeBlock code={manifest} language="json" title="manifest.json" maxHeight={560} />
    </div>
  );
}
