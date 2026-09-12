"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader/PageHeader";
import EmptyState from "@/components/molecules/EmptyState/EmptyState";
import CustomButton from "@/components/atoms/CustomButton/CustomButton";
import CustomInput from "@/components/atoms/CustomInput/CustomInput";
import AppTable from "@/components/organisms/AppTable";
import { RenderGeneralTextCell } from "@/components/organisms/AppTable/tableHelper";
import { OriginBadge, StatusBadge } from "@/components/molecules/ToneBadge/ToneBadge";
import HashChip from "@/components/molecules/HashChip/HashChip";
import RegisterAssetModal from "@/components/organisms/RegisterAssetModal/RegisterAssetModal";
import useAxios from "@/interceptor/useAxios";
import { useDebounce } from "@/hooks/useDebounce";
import { extractItems, extractTotalRecords } from "@/resources/utils/apiResponse";
import { ORIGINS } from "@/resources/constants/ztdpp";
import { formatDateTime, formatNumber, shortId } from "@/resources/utils/helper";
import shared from "@/styles/shared.module.css";
import classes from "./page.module.css";

const LIMIT = 10;
const ORIGIN_OPTIONS = Object.entries(ORIGINS).filter(([value]) => value !== "unknown");

/** "API key: <name>" when registered through the API, otherwise "Dashboard". */
function registeredVia(asset) {
  if (asset?.registeredVia) return asset.registeredVia;
  if (asset?.apiKey && typeof asset.apiKey === "object") return `API key: ${asset.apiKey.name ?? ""}`.trim();
  return asset?.apiKey ? "API key" : "Dashboard";
}

export default function AssetsPage() {
  const router = useRouter();
  const { Get } = useAxios();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [originType, setOriginType] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [showRegister, setShowRegister] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    const { response } = await Get({
      route: "assets",
      params: {
        page,
        limit: LIMIT,
        ...(originType ? { originType } : {}),
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      },
      showAlert: false,
    });
    if (id !== requestId.current) return; // a newer request superseded this one
    setItems(extractItems(response));
    setTotal(extractTotalRecords(response));
    setLoading(false);
  }, [page, originType, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  // Jump back to the first page so the new asset is visible; the page change reloads.
  const handleRegistered = () => {
    if (page === 1) void load();
    else setPage(1);
  };

  const ledgerStatus = (asset) =>
    asset.currentManifest && typeof asset.currentManifest === "object" ? asset.currentManifest.ledger?.status : null;

  const headers = [
    {
      key: "asset",
      title: "Asset",
      renderItem: ({ data }) => (
        <div>
          <RenderGeneralTextCell text={data.title || data.externalId || shortId(data.assetId, 12)} fontType="medium" />
          <div className={classes.sub}>
            v{data.versionCount ?? 1} · {formatDateTime(data.createdAt)}
          </div>
        </div>
      ),
    },
    {
      key: "origin",
      title: "Origin",
      renderItem: ({ data }) => <OriginBadge origin={data.currentOriginType} />,
    },
    {
      key: "latestContentHash",
      title: "Latest hash",
      renderItem: ({ data }) => <HashChip value={data.latestContentHash} />,
    },
    {
      key: "ledger",
      title: "Ledger",
      renderItem: ({ data }) => {
        const status = ledgerStatus(data);
        return status ? <StatusBadge status={status} /> : <span className={shared.muted}>—</span>;
      },
    },
    {
      key: "verificationCount",
      title: "Verifications",
      renderItem: ({ data }) => <RenderGeneralTextCell text={formatNumber(data.verificationCount ?? 0)} fontType="medium" />,
    },
    {
      key: "apiKey",
      title: "Registered via",
      renderItem: ({ data }) => (
        <RenderGeneralTextCell
          text={registeredVia(data)}
          fontType="light"
        />
      ),
    },
  ];

  const filtered = Boolean(originType || debouncedSearch.trim());

  return (
    <div className={shared.stack}>
      <PageHeader
        title="Assets"
        subtitle="Content registered under your account, each with a signed manifest anchored in the ZTD ledger."
        actions={
          <CustomButton onClick={() => setShowRegister(true)} leftIcon={<Plus size={16} />}>
            Register content
          </CustomButton>
        }
      />

      <div className={shared.toolbar}>
        <div className={shared.filters}>
          <select
            className={shared.select}
            value={originType}
            onChange={(e) => {
              setPage(1);
              setOriginType(e.target.value);
            }}
            aria-label="Filter by origin"
          >
            <option value="">All origins</option>
            {ORIGIN_OPTIONS.map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>
          <div className={shared.searchWrap}>
            <CustomInput
              value={search}
              setValue={(v) => {
                if (v !== search) setPage(1);
                setSearch(v);
              }}
              placeholder="Search title, external id or hash"
              leftIcon={<Search size={16} />}
              maxLength={200}
            />
          </div>
        </div>
        <span className={shared.muted}>
          {total} asset{total === 1 ? "" : "s"}
        </span>
      </div>

      {!loading && items.length === 0 ? (
        <EmptyState
          icon={<Boxes size={22} />}
          title={filtered ? "No assets match these filters" : "Nothing registered yet"}
          description={
            filtered
              ? "Try a different search term or origin filter."
              : "Register an image here or call POST /provenance/register from your platform with an API key."
          }
          action={
            !filtered && (
              <CustomButton onClick={() => setShowRegister(true)} leftIcon={<Plus size={16} />}>
                Register content
              </CustomButton>
            )
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
          onRowClick={(row) => router.push(`/assets/${encodeURIComponent(row.assetId)}`)}
        />
      )}

      <RegisterAssetModal show={showRegister} setShow={setShowRegister} onRegistered={handleRegistered} />
    </div>
  );
}
