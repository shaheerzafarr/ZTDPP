"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import Link from "next/link";
import { ScanSearch, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/molecules/PageHeader/PageHeader";
import SectionCard from "@/components/molecules/SectionCard/SectionCard";
import CustomButton from "@/components/atoms/CustomButton/CustomButton";
import FileDropzone from "@/components/organisms/FileDropzone/FileDropzone";
import TrustReport from "@/components/organisms/TrustReport/TrustReport";
import useAxios from "@/interceptor/useAxios";
import { setLastVerification } from "@/store/common/commonSlice";
import shared from "@/styles/shared.module.css";
import classes from "./page.module.css";

export default function VerifyPage() {
  const { Post, Get } = useAxios();
  const dispatch = useDispatch();
  const [file, setFile] = useState(null);
  const [manifestId, setManifestId] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState(null);

  const runVerification = async () => {
    if (!file) return;
    setLoading(true);
    setProgress(0);
    setReport(null);
    setHistory(null);

    const form = new FormData();
    form.append("file", file);

    const { response } = await Post({
      route: "verifications",
      params: manifestId.trim() ? { manifestId: manifestId.trim() } : undefined,
      data: form,
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
      onUploadProgress: (e) => {
        if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
      },
    });

    if (response?.data) {
      const data = response.data;
      setReport(data);
      dispatch(setLastVerification({ verificationId: data.verificationId, trustScore: data.trustScore, verdict: data.verdict }));
      toast.success(`Trust score ${data.trustScore} · ${data.verdictLabel}`);

      const assetId = data.provenance?.manifest?.assetId;
      if (assetId && data.provenance?.manifest) {
        // The matched asset may belong to another platform; history is optional.
        const h = await Get({ route: `assets/${encodeURIComponent(assetId)}/history`, showAlert: false });
        if (h.response?.data) setHistory(h.response.data);
      }
    }
    setLoading(false);
  };

  const reset = () => {
    setFile(null);
    setManifestId("");
    setReport(null);
    setHistory(null);
    setProgress(0);
  };

  return (
    <div className={shared.stack}>
      <PageHeader
        title="Verify an image"
        subtitle="Provenance & metadata (60%) combined with AI deepfake analysis (40%)."
        actions={
          report && (
            <CustomButton variant="outline" onClick={reset} leftIcon={<RotateCcw size={16} />}>
              Verify another
            </CustomButton>
          )
        }
      />

      {!report && (
        <SectionCard
          title="Upload"
          description="The file is fingerprinted (SHA-256 + perceptual hash) and analysed in memory. It is not stored."
        >
          <div className={classes.uploadGrid}>
            <div>
              <FileDropzone file={file} onChange={setFile} disabled={loading} />
              <label htmlFor="manifest-reference">Manifest reference (optional)</label>
              <input id="manifest-reference" value={manifestId} onChange={e => setManifestId(e.target.value)}
                maxLength={100} disabled={loading} placeholder="urn:ztdpp:manifest:..." style={{ width: "100%", padding: 12 }} />
              <p>Use the publisher?s manifest reference to select a claim when several accounts registered the same image.</p>
            </div>
            <div className={classes.side}>
              <ol className={classes.steps}>
                <li>
                  <strong>Fingerprint</strong> — SHA-256, pHash, EXIF/XMP extraction.
                </li>
                <li>
                  <strong>Provenance</strong> — exact and near-duplicate lookup against registered manifests, signature
                  and ZTD ledger proof re-computation.
                </li>
                <li>
                  <strong>AI analysis</strong> — deepfake model scored for consistency with the declared origin.
                </li>
                <li>
                  <strong>Trust score</strong> — weighted combination with verdict, classification and signals.
                </li>
              </ol>
              <CustomButton
                onClick={runVerification}
                disabled={!file || loading}
                loading={loading}
                fullWidth
                leftIcon={<ScanSearch size={16} />}
              >
                {loading ? (progress < 100 ? `Uploading ${progress}%` : "Analysing…") : "Run verification"}
              </CustomButton>
              <p className={shared.muted}>
                Need programmatic access? See the{" "}
                <Link href="/docs" className={shared.linkButton}>
                  integration docs
                </Link>
                .
              </p>
            </div>
          </div>
        </SectionCard>
      )}

      {report && (
        <>
          <div className={classes.reportMeta}>
            <span className={shared.muted}>
              Verification <code className={shared.mono}>{report.verificationId}</code> · {report.processingMs} ms
            </span>
            <Link href={`/verifications/${encodeURIComponent(report.verificationId)}`} className={shared.linkButton}>
              Permanent link
            </Link>
          </div>
          <TrustReport report={report} history={history} manifestLinkBase="/assets/manifest" />
        </>
      )}
    </div>
  );
}
