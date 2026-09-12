"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Boxes, Loader2, Search, X } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader/PageHeader";
import EmptyState from "@/components/molecules/EmptyState/EmptyState";
import CustomInput from "@/components/atoms/CustomInput/CustomInput";
import AppTable from "@/components/organisms/AppTable";
import { RenderGeneralTextCell } from "@/components/organisms/AppTable/tableHelper";
import { OriginBadge, StatusBadge } from "@/components/molecules/ToneBadge/ToneBadge";
import HashChip from "@/components/molecules/HashChip/HashChip";
import useAxios from "@/interceptor/useAxios";
import { useDebounce } from "@/hooks/useDebounce";
import { extractItems, extractTotalRecords } from "@/resources/utils/apiResponse";
import { ORIGINS } from "@/resources/constants/ztdpp";
import { formatDateTime, formatNumber, getDisplayName, shortId } from "@/resources/utils/helper";
import shared from "@/styles/shared.module.css";
import classes from "./page.module.css";

const LIMIT = 10;

export default function AdminAssetsPage() {
  return (
    <Suspense
      fallback={
        <div className={shared.loaderRow}>
          <Loader2 className={shared.spin} />
        </div>
      }
    >
      <AdminAssetsContent />
    </Suspense>
  );
}

function AdminAssetsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const owner = searchParams.get("owner") ?? "";
  const { Get } = useAxios();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [originType, setOriginType] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim(), 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, originType, owner]);

  const load = useCallback(async () => {
    setLoading(true);
    const { response } = await Get({
      route: "admin/assets",
      params: {
        page,
        limit: LIMIT,
        ...(originType ? { originType } : {}),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(owner ? { owner } : {}),
      },
      showAlert: false,
    });
    setItems(extractItems(response));
    setTotal(extractTotalRecords(response));
    setLoading(false);
  }, [Get, page, originType, debouncedSearch, owner]);

  useEffect(() => {
    void load();
  }, [load]);

  const headers = [
    {
      key: "title",
      title: "Asset",
      renderItem: ({ data }) => (
        <div>
          <RenderGeneralTextCell
            text={data.title || data.externalId || shortId(data.assetId, 12)}
            fontType="medium"
          />
          <div className={classes.sub}>
            v{data.versionCount ?? 1} · {data.mimeType ?? "unknown type"} · {formatDateTime(data.createdAt)}
          </div>
        </div>
      ),
    },
    {
      key: "origin",
      title: "Origin",
      renderItem: ({ data }) => (
        <div className={classes.badges}>
          <OriginBadge origin={data.currentOriginType} short />
          {data.rootOriginType && data.rootOriginType !== data.currentOriginType && (
            <span className={classes.sub}>from {ORIGINS[data.rootOriginType]?.short ?? data.rootOriginType}</span>
          )}
        </div>
      ),
    },
    {
      key: "owner",
      title: "Owner",
      renderItem: ({ data }) => <OwnerCell owner={data.owner} />,
    },
    {
      key: "counts",
      title: "Versions / verifications",
      renderItem: ({ data }) => (
        <RenderGeneralTextCell
          text={`${formatNumber(data.versionCount ?? 0)} / ${formatNumber(data.verificationCount ?? 0)}`}
          fontType="regular"
        />
      ),
    },
    {
      key: "ledger",
      title: "Ledger",
      renderItem: ({ data }) => {
        const manifest = data.currentManifest;
        const ledgerStatus = manifest && typeof manifest === "object" ? manifest.ledger?.status : null;
        return ledgerStatus ? <StatusBadge status={ledgerStatus} /> : <span className={shared.muted}>—</span>;
      },
    },
    { key: "hash", title: "Latest hash", renderItem: ({ data }) => <HashChip value={data.latestContentHash} /> },
    {
      key: "assetId",
      title: "Asset id",
      renderItem: ({ data }) => <HashChip value={data.assetId} head={14} tail={6} />,
    },
  ];

  const hasFilters = Boolean(originType || debouncedSearch || owner);

  return (
    <div className={shared.stack}>
      <PageHeader title="Assets" subtitle="Every asset registered on the platform, across all owners and API keys." />

      <div className={shared.toolbar}>
        <div className={shared.filters}>
          <div className={shared.searchWrap}>
            <CustomInput
              value={search}
              setValue={setSearch}
              placeholder="Search title, external id, hash…"
              leftIcon={<Search size={16} />}
              maxLength={120}
            />
          </div>
          <select className={shared.select} value={originType} onChange={(e) => setOriginType(e.target.value)}>
            <option value="">All origins</option>
            {Object.entries(ORIGINS).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>
          {owner && (
            <button type="button" className={classes.filterChip} onClick={() => router.push("/admin/assets")}>
              Owner: {shortId(owner)}
              <X size={14} />
            </button>
          )}
        </div>
        <span className={shared.muted}>
          {formatNumber(total)} asset{total === 1 ? "" : "s"}
        </span>
      </div>

      {!loading && items.length === 0 ? (
        <EmptyState
          icon={<Boxes size={22} />}
          title={hasFilters ? "No assets match" : "No assets registered"}
          description={
            hasFilters
              ? "Try a different search, origin or owner filter."
              : "Assets registered through the API or the dashboard will appear here."
          }
        />
      ) : (
        <AppTable
          data={items}
          tableHeader={headers}
          loading={loading}
          page={page}
          totalRecords={total}
          limitPerPage={LIMIT}
          onPageChange={setPage}
          onRowClick={(row) => router.push(`/admin/assets/${encodeURIComponent(row.assetId)}`)}
        />
      )}
    </div>
  );
}

function OwnerCell({ owner }) {
  if (!owner) return <span className={shared.muted}>—</span>;
  if (typeof owner === "object") {
    return (
      <div>
        <RenderGeneralTextCell text={getDisplayName(owner)} fontType="medium" />
        {owner.email && <div className={classes.sub}>{owner.email}</div>}
      </div>
    );
  }
  return <code className={shared.mono}>{shortId(owner)}</code>;
}
