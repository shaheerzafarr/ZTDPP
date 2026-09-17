"use client";
import { useState } from "react";
import { AlertOctagon, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import SectionCard from "@/components/molecules/SectionCard/SectionCard";
import TrustGauge, { ScoreBar } from "@/components/molecules/TrustGauge/TrustGauge";
import HashChip from "@/components/molecules/HashChip/HashChip";
import KeyValueList from "@/components/molecules/KeyValueList/KeyValueList";
import CodeBlock from "@/components/molecules/CodeBlock/CodeBlock";
import {
  ClassificationBadge,
  MatchBadge,
  ToneBadge,
  VerdictBadge,
} from "@/components/molecules/ToneBadge/ToneBadge";
import ProvenanceTimeline from "@/components/organisms/ProvenanceTimeline/ProvenanceTimeline";
import Tabs from "@/components/molecules/Tabs/Tabs";
import { SEVERITY_TONES, VERDICTS } from "@/resources/constants/ztdpp";
import { formatBytes, formatDateTime, formatPercent, scoreTone } from "@/resources/utils/helper";
import classes from "./TrustReport.module.css";

const severityIcon = {
  critical: AlertOctagon,
  warning: AlertTriangle,
  positive: CheckCircle2,
  info: Info,
};

/**
 * Full trust report renderer used by /verify, /verifications/[id] and the
 * admin verification detail. `report` is the backend verification report.
 * `history` (optional) is the asset lineage { asset, timeline } to draw the
 * provenance chain when a manifest matched.
 */
export default function TrustReport({ report, history, manifestLinkBase, className }) {
  const [tab, setTab] = useState("signals");
  if (!report) return null;

  const meta = VERDICTS[report.verdict] ?? { label: report.verdict, description: "" };
  const metadata = report.scores?.metadata ?? {};
  const ai = report.scores?.ai ?? {};
  const aiResult = report.ai ?? {};
  const manifest = report.provenance?.manifest ?? null;
  const embedded = report.embeddedMetadata ?? {};
  const checks = report.checks ?? {};

  const tabs = [
    { value: "signals", label: "Signals", badge: report.signals?.length || undefined },
    { value: "breakdown", label: "Score breakdown" },
    { value: "provenance", label: "Provenance" },
    { value: "metadata", label: "Embedded metadata" },
    { value: "raw", label: "Raw JSON" },
  ];

  return (
    <div className={cn(classes.root, className)}>
      <div>
        <button type="button" onClick={() => {
          const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
          const link = document.createElement("a"); link.href = url;
          link.download = "verification-" + report.verificationId.replace(/[^a-zA-Z0-9_-]/g, "_") + ".json";
          link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        }}>Download report JSON</button>
        {report.provenance?.currentManifestStatus === "revoked" && <p role="alert">The referenced claim is currently revoked. The scores below reflect the original verification time.</p>}
      </div>
      {/* ------------------------------------------------------------ hero */}
      <SectionCard padded={false} className={classes.hero}>
        <div className={classes.heroInner}>
          <TrustGauge score={report.trustScore} sublabel={meta.label} />
          <div className={classes.heroText}>
            <div className={classes.badges}>
              <VerdictBadge verdict={report.verdict} size="lg" />
              <ClassificationBadge
                classification={report.classification}
                basis={report.classificationBasis}
                size="lg"
              />
              <MatchBadge match={report.provenance?.match} size="lg" />
            </div>
            <p className={classes.verdictText}>{meta.description}</p>

            <div className={classes.weights}>
              <WeightCard
                title="Provenance & metadata"
                score={metadata.score}
                weight={metadata.weight}
                effective={metadata.effectiveWeight}
              />
              <WeightCard
                title="AI deepfake analysis"
                score={ai.score}
                weight={ai.weight}
                effective={ai.effectiveWeight}
                note={
                  aiResult.status !== "ok"
                    ? `Model ${aiResult.status}${aiResult.error ? ` · ${aiResult.error}` : ""}`
                    : `${aiResult.label} · P(fake) ${formatPercent(aiResult.fakeProbability)} · ${aiResult.latencyMs} ms`
                }
              />
            </div>

            <div className={classes.inputRow}>
              <HashChip label="sha256" value={report.input?.contentHash} />
              {report.input?.phash && <HashChip label="phash" value={report.input.phash} head={16} tail={0} />}
              <span className={classes.inputMeta}>
                {report.input?.fileName ?? "upload"} · {report.input?.mimeType} · {formatBytes(report.input?.fileSize)}
                {report.input?.width ? ` · ${report.input.width}×${report.input.height}` : ""}
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ------------------------------------------------------------ tabs */}
      <SectionCard padded={false}>
        <div className={classes.tabsBar}>
          <Tabs tabs={tabs} activeTab={tab} onTabChange={setTab} variant="underline" />
        </div>

        <div className={classes.tabBody}>
          {tab === "signals" && <SignalList signals={report.signals} />}

          {tab === "breakdown" && (
            <div className={classes.breakdown}>
              <h4 className={classes.subheading}>
                Metadata score · {metadata.score}/100 (weight {metadata.effectiveWeight}%)
              </h4>
              <ul className={classes.componentList}>
                {(report.metadataBreakdown ?? []).map((c) => (
                  <li key={c.key} className={classes.component}>
                    <div className={classes.componentHead}>
                      <span className={classes.componentLabel}>{c.label}</span>
                      <span className={classes.componentScore}>
                        {c.score}/{c.max}
                      </span>
                    </div>
                    <ScoreBar score={c.score} max={c.max} tone={scoreTone((c.score / c.max) * 100)} />
                    {c.detail && <p className={classes.componentDetail}>{c.detail}</p>}
                  </li>
                ))}
              </ul>

              <h4 className={classes.subheading}>
                AI score · {ai.score ?? "n/a"}
                {ai.score !== null && ai.score !== undefined ? "/100" : ""} (weight {ai.effectiveWeight}%)
              </h4>
              <KeyValueList
                columns={3}
                dense
                items={[
                  { label: "Model status", value: aiResult.status },
                  { label: "Label", value: aiResult.label },
                  { label: "P(fake)", value: formatPercent(aiResult.fakeProbability, 1) },
                  { label: "P(real)", value: formatPercent(aiResult.realProbability, 1) },
                  { label: "Confidence", value: formatPercent(aiResult.confidence, 1) },
                  { label: "Latency", value: aiResult.latencyMs ? `${aiResult.latencyMs} ms` : "—" },
                  { label: "Model version", value: aiResult.modelVersion },
                  { label: "Error", value: aiResult.error, hidden: !aiResult.error },
                ]}
              />
              <p className={classes.formula}>
                trust = {metadata.effectiveWeight}% × {metadata.score}
                {ai.score !== null && ai.score !== undefined ? ` + ${ai.effectiveWeight}% × ${ai.score}` : ""} ={" "}
                <strong>{report.trustScore}</strong>
              </p>
            </div>
          )}

          {tab === "provenance" && (
            <div className={classes.provenance}>
              {manifest ? (
                <>
                  <KeyValueList
                    columns={3}
                    dense
                    items={[
                      { label: "Manifest", value: <HashChip value={manifest.manifestId} head={22} tail={10} />, },
                      { label: "Asset", value: <HashChip value={manifest.assetId} head={18} tail={10} /> },
                      { label: "Version", value: `v${manifest.version}` },
                      { label: "Declared origin", value: manifest.originLabel },
                      { label: "Claim generator", value: `${manifest.claimGenerator?.name ?? "—"}${manifest.claimGenerator?.platform ? ` · ${manifest.claimGenerator.platform}` : ""}` },
                      { label: "Registered", value: formatDateTime(manifest.registeredAt) },
                      { label: "Match", value: <MatchBadge match={report.provenance?.match} /> },
                      { label: "pHash distance", value: report.provenance?.phashDistance ?? "—" },
                      { label: "Manifest hash", value: <HashChip value={manifest.manifestHash} /> },
                    ]}
                  />

                  <div className={classes.checksGrid}>
                    <CheckCard
                      title="Manifest signature"
                      ok={checks.signature?.valid}
                      rows={[
                        ["Hash matches", checks.signature?.hashMatches],
                        ["Ed25519 valid", checks.signature?.valid],
                        ["Key id", manifest.signature?.keyId],
                      ]}
                    />
                    <CheckCard
                      title="ZTD ledger"
                      ok={checks.ledger?.found ? checks.ledger?.ok : null}
                      rows={[
                        ["Entry", checks.ledger?.found ? `#${checks.ledger.seq} · ${checks.ledger.status}` : "not found"],
                        ["Block", checks.ledger?.blockIndex ?? "pending"],
                        ["Entry hash valid", checks.ledger?.entryHashValid],
                        ["Chain link valid", checks.ledger?.chainLinkValid],
                        ["Merkle proof valid", checks.ledger?.merkleProofValid],
                        ["Block signature valid", checks.ledger?.blockSignatureValid],
                        ["Manifest hash matches", checks.ledger?.manifestHashMatches],
                      ]}
                    />
                  </div>

                  {history?.timeline?.length ? (
                    <>
                      <h4 className={classes.subheading}>Version history</h4>
                      <ProvenanceTimeline
                        manifests={history.timeline}
                        highlightManifestId={manifest.manifestId}
                        linkBase={manifestLinkBase}
                      />
                    </>
                  ) : (
                    <>
                      <h4 className={classes.subheading}>Matched manifest</h4>
                      <ProvenanceTimeline manifests={[manifest]} highlightManifestId={manifest.manifestId} linkBase={manifestLinkBase} />
                    </>
                  )}
                </>
              ) : (
                <p className={classes.muted}>
                  No registered manifest matched this content. The classification is inferred from embedded metadata
                  and the AI model only.
                </p>
              )}
            </div>
          )}

          {tab === "metadata" && (
            <div className={classes.metadata}>
              <KeyValueList
                columns={3}
                dense
                items={[
                  { label: "Format", value: embedded.format },
                  { label: "Dimensions", value: embedded.width ? `${embedded.width} × ${embedded.height}` : "—" },
                  { label: "C2PA container", value: embedded.c2pa?.containerPresent ? `present (${embedded.c2pa.format})` : "absent" },
                  { label: "EXIF present", value: embedded.exif?.present ? "yes" : "no" },
                  { label: "Make / model", value: embedded.exif?.make ? `${embedded.exif.make} ${embedded.exif.model ?? ""}` : "—" },
                  { label: "Software", value: embedded.exif?.software },
                  { label: "Captured", value: embedded.exif?.dateTimeOriginal ? formatDateTime(embedded.exif.dateTimeOriginal) : "—" },
                  { label: "Lens", value: embedded.exif?.lensModel },
                  { label: "GPS", value: embedded.exif?.hasGps ? "present (not stored)" : "absent" },
                  { label: "XMP creator tool", value: embedded.xmp?.creatorTool },
                  { label: "Digital source type", value: embedded.xmp?.digitalSourceType ?? embedded.iptc?.digitalSourceType },
                  { label: "AI generator hints", value: embedded.aiHints?.detected ? embedded.aiHints.indicators.join(", ") : "none" },
                ]}
              />
              {embedded.xmp?.history?.length ? (
                <>
                  <h4 className={classes.subheading}>XMP edit history</h4>
                  <ul className={classes.historyList}>
                    {embedded.xmp.history.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          )}

          {tab === "raw" && <CodeBlock code={report} language="json" title="verification report" maxHeight={520} />}
        </div>
      </SectionCard>
    </div>
  );
}

function WeightCard({ title, score, weight, effective, note }) {
  const has = typeof score === "number";
  return (
    <div className={classes.weightCard} data-tone={scoreTone(has ? score : null)}>
      <div className={classes.weightHead}>
        <span className={classes.weightTitle}>{title}</span>
        <span className={classes.weightBadge}>
          {effective !== weight ? `${effective}% (configured ${weight}%)` : `${weight}%`}
        </span>
      </div>
      <div className={classes.weightScore}>{has ? score : "n/a"}</div>
      <ScoreBar score={has ? score : 0} tone={scoreTone(has ? score : null)} />
      {note && <p className={classes.weightNote}>{note}</p>}
    </div>
  );
}

function CheckCard({ title, ok, rows }) {
  const tone = ok === true ? "success" : ok === false ? "danger" : "neutral";
  return (
    <div className={classes.checkCard}>
      <div className={classes.checkHead}>
        <span className={classes.checkTitle}>{title}</span>
        <ToneBadge tone={tone}>{ok === true ? "verified" : ok === false ? "failed" : "n/a"}</ToneBadge>
      </div>
      <ul className={classes.checkRows}>
        {rows.map(([label, value]) => (
          <li key={label}>
            <span>{label}</span>
            <span className={classes.checkValue}>{renderCheckValue(value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function renderCheckValue(value) {
  if (value === true) return <span className={classes.ok}>✓</span>;
  if (value === false) return <span className={classes.bad}>✕</span>;
  if (value === null || value === undefined) return "—";
  return String(value);
}

export function SignalList({ signals = [], compact = false }) {
  if (!signals.length) return <p className={classes.muted}>No signals.</p>;
  return (
    <ul className={cn(classes.signals, compact && classes.signalsCompact)}>
      {signals.map((s, i) => {
        const Icon = severityIcon[s.severity] ?? Info;
        return (
          <li key={`${s.code}-${i}`} className={classes.signal} data-tone={SEVERITY_TONES[s.severity] ?? "neutral"}>
            <Icon size={18} className={classes.signalIcon} />
            <div>
              <div className={classes.signalHead}>
                <span className={classes.signalCode}>{s.code.replace(/_/g, " ")}</span>
                <ToneBadge tone={SEVERITY_TONES[s.severity] ?? "neutral"}>{s.severity}</ToneBadge>
              </div>
              <p className={classes.signalMessage}>{s.message}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
