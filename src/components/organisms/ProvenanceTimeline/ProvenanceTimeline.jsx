"use client";
import Link from "next/link";
import { Camera, Cpu, Link2, PenTool, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import HashChip from "@/components/molecules/HashChip/HashChip";
import { OriginBadge, StatusBadge } from "@/components/molecules/ToneBadge/ToneBadge";
import { ACTION_LABELS } from "@/resources/constants/ztdpp";
import { formatDateTime } from "@/resources/utils/helper";
import classes from "./ProvenanceTimeline.module.css";

const iconFor = (originType) => {
  switch (originType) {
    case "camera":
      return Camera;
    case "ai_generated":
      return Sparkles;
    case "digital_creation":
      return PenTool;
    case "ai_generated_edited":
      return Wand2;
    case "edited":
      return Cpu;
    default:
      return Link2;
  }
};

/**
 * Vertical version timeline for an asset lineage.
 * manifests: publicManifest[] ordered by version asc
 * highlightManifestId: manifest to emphasise (e.g. the one matched by a verification)
 * linkBase: optional path prefix for manifest links (e.g. "/assets/manifest")
 */
export default function ProvenanceTimeline({ manifests = [], highlightManifestId, linkBase, className }) {
  if (!manifests.length) return null;

  return (
    <ol className={cn(classes.list, className)}>
      {manifests.map((m, i) => {
        const Icon = iconFor(m.originType);
        const isHighlight = highlightManifestId && m.manifestId === highlightManifestId;
        const isLast = i === manifests.length - 1;
        return (
          <li key={m.manifestId} className={cn(classes.item, isHighlight && classes.highlight)}>
            <div className={classes.rail}>
              <span className={classes.node} data-origin={m.originType}>
                <Icon size={15} />
              </span>
              {!isLast && <span className={classes.line} />}
            </div>
            <div className={classes.body}>
              <div className={classes.head}>
                <div className={classes.titleRow}>
                  <span className={classes.version}>v{m.version}</span>
                  <OriginBadge origin={m.originType} />
                  {m.ledger?.status && <StatusBadge status={m.ledger.status} />}
                  {isHighlight && <span className={classes.matchedTag}>matched</span>}
                </div>
                <span className={classes.date}>{formatDateTime(m.registeredAt)}</span>
              </div>

              <div className={classes.claim}>
                Registered by <strong>{m.claimGenerator?.name ?? "unknown"}</strong>
                {m.claimGenerator?.platform ? ` · ${m.claimGenerator.platform}` : ""}
                {m.hashOnly ? " · hash-only" : ""}
              </div>

              {Array.isArray(m.actions) && m.actions.length > 0 && (
                <ul className={classes.actions}>
                  {m.actions.map((a, ai) => (
                    <li key={ai} className={classes.action}>
                      <span className={classes.actionLabel}>{ACTION_LABELS[a.action] ?? a.action}</span>
                      {a.softwareAgent && <span className={classes.actionMeta}>{a.softwareAgent}</span>}
                      {a.when && <span className={classes.actionMeta}>{formatDateTime(a.when)}</span>}
                      {a.description && <span className={classes.actionMeta}>{a.description}</span>}
                    </li>
                  ))}
                </ul>
              )}

              <div className={classes.hashes}>
                <HashChip label="sha256" value={m.contentHash} />
                {m.phash && <HashChip label="phash" value={m.phash} head={16} tail={0} />}
                {m.ledger?.blockIndex !== null && m.ledger?.blockIndex !== undefined && (
                  <span className={classes.block}>block #{m.ledger.blockIndex}</span>
                )}
              </div>

              {linkBase && (
                <Link href={`${linkBase}/${encodeURIComponent(m.manifestId)}`} className={classes.link}>
                  View manifest
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
