"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileQuestion, Loader2, ScanSearch } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader/PageHeader";
import EmptyState from "@/components/molecules/EmptyState/EmptyState";
import CustomButton from "@/components/atoms/CustomButton/CustomButton";
import TrustReport from "@/components/organisms/TrustReport/TrustReport";
import useAxios from "@/interceptor/useAxios";
import { formatDateTime } from "@/resources/utils/helper";
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

export default function VerificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { Get } = useAxios();
  const id = safeDecode(params?.id);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState(null);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setReport(null);
    setHistory(null);

    const { response } = await Get({
      route: `verifications/${encodeURIComponent(id)}`,
      showAlert: false,
    });
    const data = response?.data ?? null;
    setReport(data);

    // The matched asset may belong to another platform (403); history is optional.
    const assetId = data?.provenance?.manifest?.assetId;
    if (assetId) {
      const h = await Get({ route: `assets/${encodeURIComponent(assetId)}/history`, showAlert: false });
      if (h.response?.data) setHistory(h.response.data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const subtitle = report
    ? `${report.verificationId} · ${formatDateTime(report.createdAt)}${report.source ? ` · via ${report.source}` : ""}`
    : id;

  return (
    <div className={shared.stack}>
      <PageHeader
        backHref="/verifications"
        title="Verification report"
        subtitle={subtitle}
        actions={
          <CustomButton variant="outline" onClick={() => router.push("/verify")} leftIcon={<ScanSearch size={16} />}>
            New verification
          </CustomButton>
        }
      />

      {loading ? (
        <div className={shared.loaderRow}>
          <Loader2 size={22} className={shared.spin} />
          <span className={classes.loaderText}>Loading report…</span>
        </div>
      ) : !report ? (
        <EmptyState
          icon={<FileQuestion size={22} />}
          title="Verification not found"
          description="This report does not exist or does not belong to your account."
          action={<CustomButton onClick={() => router.push("/verifications")}>Back to verifications</CustomButton>}
        />
      ) : (
        <TrustReport report={report} history={history} manifestLinkBase="/assets/manifest" />
      )}
    </div>
  );
}
