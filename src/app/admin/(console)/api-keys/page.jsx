"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Loader2, MoreVertical, Search, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/molecules/PageHeader/PageHeader";
import EmptyState from "@/components/molecules/EmptyState/EmptyState";
import CustomInput from "@/components/atoms/CustomInput/CustomInput";
import MenuPopup from "@/components/atoms/MenuPopup/MenuPopup";
import AreYouSure from "@/components/organisms/AreYouSure/AreYouSure";
import AppTable from "@/components/organisms/AppTable";
import { RenderGeneralTextCell } from "@/components/organisms/AppTable/tableHelper";
import { StatusBadge, ToneBadge } from "@/components/molecules/ToneBadge/ToneBadge";
import useAxios from "@/interceptor/useAxios";
import { useDebounce } from "@/hooks/useDebounce";
import { extractItems, extractTotalRecords } from "@/resources/utils/apiResponse";
import { formatDateTime, formatNumber, getDisplayName, shortId, timeAgo } from "@/resources/utils/helper";
import shared from "@/styles/shared.module.css";
import classes from "./page.module.css";

const LIMIT = 10;

export default function AdminApiKeysPage() {
  return (
    <Suspense
      fallback={
        <div className={shared.loaderRow}>
          <Loader2 className={shared.spin} />
        </div>
      }
    >
      <AdminApiKeysContent />
    </Suspense>
  );
}

function AdminApiKeysContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const owner = searchParams.get("owner") ?? "";
  const { Get, Delete } = useAxios();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim(), 400);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, owner]);

  const load = useCallback(async () => {
    setLoading(true);
    const { response } = await Get({
      route: "admin/api-keys",
      params: {
        page,
        limit: LIMIT,
        ...(status ? { status } : {}),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(owner ? { owner } : {}),
      },
      showAlert: false,
    });
    setItems(extractItems(response));
    setTotal(extractTotalRecords(response));
    setLoading(false);
  }, [Get, page, status, debouncedSearch, owner]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRevoke = async () => {
    if (!confirm) return;
    setBusy(true);
    const { response } = await Delete({ route: `admin/api-keys/${encodeURIComponent(confirm._id)}` });
    if (response) toast.success("API key revoked");
    setBusy(false);
    setConfirm(null);
    void load();
  };

  const ownerLabel = (() => {
    if (!owner) return "";
    const match = items.find((k) => k.owner && typeof k.owner === "object" && k.owner._id === owner);
    return match ? getDisplayName(match.owner) : shortId(owner);
  })();

  const headers = [
    {
      key: "name",
      title: "Name",
      renderItem: ({ data }) => (
        <div>
          <RenderGeneralTextCell text={data.name} fontType="medium" />
          {data.description && <div className={classes.sub}>{data.description}</div>}
        </div>
      ),
    },
    {
      key: "owner",
      title: "Owner",
      renderItem: ({ data }) => <OwnerCell owner={data.owner} />,
    },
    { key: "masked", title: "Key", renderItem: ({ data }) => <code className={shared.mono}>{data.masked}</code> },
    {
      key: "scopes",
      title: "Scopes",
      renderItem: ({ data }) => (
        <div className={classes.scopes}>
          {(data.scopes ?? []).map((s) => (
            <ToneBadge key={s} tone="neutral">
              {s}
            </ToneBadge>
          ))}
        </div>
      ),
    },
    {
      key: "rateLimitPerMinute",
      title: "Limit",
      renderItem: ({ data }) => <RenderGeneralTextCell text={`${data.rateLimitPerMinute}/min`} fontType="light" />,
    },
    {
      key: "totalRequests",
      title: "Requests",
      renderItem: ({ data }) => (
        <div>
          <RenderGeneralTextCell text={formatNumber(data.totalRequests)} fontType="medium" />
          <div className={classes.sub}>{data.lastUsedAt ? `used ${timeAgo(data.lastUsedAt)}` : "never used"}</div>
        </div>
      ),
    },
    { key: "status", title: "Status", renderItem: ({ data }) => <StatusBadge status={data.status} /> },
    {
      key: "createdAt",
      title: "Created",
      renderItem: ({ data }) => <RenderGeneralTextCell text={formatDateTime(data.createdAt)} fontType="light" />,
    },
  ];

  const actions = [
    {
      renderItem: (row) => (
        <MenuPopup
          menuButton={<MoreVertical className={shared.rowMenuIcon} />}
          value={row.data}
          items={[
            {
              label: "View owner's keys",
              disabled: !row.data.owner || typeof row.data.owner !== "object",
              onClick: ({ value }) => router.push(`/admin/api-keys?owner=${encodeURIComponent(value.owner._id)}`),
            },
            {
              label: "Revoke",
              className: shared.deleteAction,
              disabled: row.data.status !== "active",
              onClick: ({ value }) => setConfirm(value),
            },
          ]}
        />
      ),
    },
  ];

  const hasFilters = Boolean(status || debouncedSearch || owner);

  return (
    <div className={shared.stack}>
      <PageHeader title="API keys" subtitle="All platform keys across tenants. Revoking a key is immediate and irreversible." />

      <div className={shared.toolbar}>
        <div className={shared.filters}>
          <div className={shared.searchWrap}>
            <CustomInput
              value={search}
              setValue={setSearch}
              placeholder="Search name, prefix, owner…"
              leftIcon={<Search size={16} />}
              maxLength={120}
            />
          </div>
          <select className={shared.select} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="revoked">Revoked</option>
          </select>
          {owner && (
            <button type="button" className={classes.filterChip} onClick={() => router.push("/admin/api-keys")}>
              Owner: {ownerLabel}
              <X size={14} />
            </button>
          )}
        </div>
        <span className={shared.muted}>
          {formatNumber(total)} key{total === 1 ? "" : "s"}
        </span>
      </div>

      {!loading && items.length === 0 ? (
        <EmptyState
          icon={<KeyRound size={22} />}
          title={hasFilters ? "No keys match" : "No API keys yet"}
          description={
            hasFilters ? "Try a different search, status or owner filter." : "Keys created by any user will show up here."
          }
        />
      ) : (
        <AppTable
          data={items}
          tableHeader={headers}
          loading={loading}
          actions={actions}
          page={page}
          totalRecords={total}
          limitPerPage={LIMIT}
          onPageChange={setPage}
        />
      )}

      <AreYouSure
        show={Boolean(confirm)}
        setShow={(v) => !v && setConfirm(null)}
        loading={busy}
        text="Revoke this key?"
        message={`"${confirm?.name ?? ""}" will stop working immediately. The owner's integrations using it will receive 401 responses.`}
        buttonText="Revoke"
        handleConfirm={handleRevoke}
      />
    </div>
  );
}

function OwnerCell({ owner }) {
  if (!owner) return <span className={shared.muted}>—</span>;
  if (typeof owner !== "object") return <code className={shared.mono}>{shortId(owner)}</code>;
  return (
    <div>
      <RenderGeneralTextCell text={getDisplayName(owner)} fontType="medium" />
      <div className={classes.sub}>{owner.email}</div>
      {owner.company && <div className={classes.sub}>{owner.company}</div>}
    </div>
  );
}
