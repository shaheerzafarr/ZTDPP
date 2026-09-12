"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, ScanSearch } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader/PageHeader";
import EmptyState from "@/components/molecules/EmptyState/EmptyState";
import CustomButton from "@/components/atoms/CustomButton/CustomButton";
import KeyValueList from "@/components/molecules/KeyValueList/KeyValueList";
import HashChip from "@/components/molecules/HashChip/HashChip";
import { ToneBadge } from "@/components/molecules/ToneBadge/ToneBadge";
import TrustReport from "@/components/organisms/TrustReport/TrustReport";
import useAxios from "@/interceptor/useAxios";
import { formatDateTime, getDisplayName, shortId } from "@/resources/utils/helper";
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

export default function AdminVerificationDetailPage() {
  const params = useParams();
  const verificationId = safeDecode(Array.isArray(params?.id) ? params.id[0] : params?.id);
  const { Get } = useAxios();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState(null);

  const load = useCallback(async () => {
    if (!verificationId) return;
    setLoading(true);
    setHistory(null);
    const { response } = await Get({
      route: `admin/verifications/${encodeURIComponent(verificationId)}`,
      showAlert: false,
    });
    const data = response?.data ?? null;
    setReport(data);

    const assetId = data?.provenance?.manifest?.assetId;
    if (assetId) {
      const h = await Get({ route: `admin/assets/${encodeURIComponent(assetId)}/history`, showAlert: false });
      if (h.response?.data) setHistory(h.response.data);
    }
    setLoading(false);
  }, [Get, verificationId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className={shared.stack}>
      <PageHeader
        title="Verification report"
        subtitle={report ? `${report.input?.fileName ?? "upload"} · ${formatDateTime(report.createdAt)}` : "Full trust report with provenance lineage."}
        backHref="/admin/verifications"
        breadcrumbs={[
          { label: "Verifications", href: "/admin/verifications" },
          { label: shortId(verificationId, 12) },
        ]}
      />

      {loading ? (
        <div className={shared.loaderRow}>
          <Loader2 className={shared.spin} />
        </div>
      ) : !report ? (
        <EmptyState
          icon={<ScanSearch size={22} />}
          title="Report not found"
          description="No verification matches this identifier, or it has been removed."
          action={<CustomButton onClick={load}>Retry</CustomButton>}
        />
      ) : (
        <>
          <div className={classes.meta}>
            <KeyValueList
              columns={3}
              dense
              items={[
                { label: "Verification id", value: <HashChip value={report.verificationId} head={16} tail={8} /> },
                {
                  label: "Source",
                  value: (
                    <span className={classes.inline}>
                      <ToneBadge tone={report.source === "api" ? "info" : "neutral"}>{report.source ?? "—"}</ToneBadge>
                      {report.apiKey?.name && <span className={shared.muted}>{report.apiKey.name}</span>}
                    </span>
                  ),
                },
                { label: "Requester", value: <RequesterValue requester={report.requester} /> },
                { label: "Processed in", value: report.processingMs ? `${report.processingMs} ms` : null },
                {
                  label: "Matched asset",
                  value: report.provenance?.manifest?.assetId ? (
                    <HashChip value={report.provenance.manifest.assetId} head={16} tail={8} />
                  ) : null,
                },
                { label: "Created", value: formatDateTime(report.createdAt) },
              ]}
            />
          </div>

          <TrustReport report={report} history={history} manifestLinkBase={null} />
        </>
      )}
    </div>
  );
}

function RequesterValue({ requester }) {
  if (!requester) return <span className={shared.muted}>anonymous</span>;
  if (typeof requester === "object") {
    return (
      <span>
        {getDisplayName(requester)}
        {requester.email && <span className={shared.muted}> · {requester.email}</span>}
      </span>
    );
  }
  return <code className={shared.mono}>{shortId(requester)}</code>;
}
