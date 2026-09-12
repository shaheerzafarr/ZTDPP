"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Boxes, KeyRound, Layers, Loader2, MoreVertical, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/molecules/PageHeader/PageHeader";
import EmptyState from "@/components/molecules/EmptyState/EmptyState";
import CustomInput from "@/components/atoms/CustomInput/CustomInput";
import MenuPopup from "@/components/atoms/MenuPopup/MenuPopup";
import Modal from "@/components/organisms/Modal/Modal";
import AreYouSure from "@/components/organisms/AreYouSure/AreYouSure";
import AppTable from "@/components/organisms/AppTable";
import { RenderGeneralTextCell } from "@/components/organisms/AppTable/tableHelper";
import { StatusBadge } from "@/components/molecules/ToneBadge/ToneBadge";
import KeyValueList from "@/components/molecules/KeyValueList/KeyValueList";
import useAxios from "@/interceptor/useAxios";
import { useDebounce } from "@/hooks/useDebounce";
import { extractItems, extractTotalRecords } from "@/resources/utils/apiResponse";
import { formatDateTime, formatNumber, getDisplayName, titleCase } from "@/resources/utils/helper";
import shared from "@/styles/shared.module.css";
import classes from "./page.module.css";

const LIMIT = 10;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "email verification pending", label: "Email verification pending" },
];

const USAGE_EVENTS = ["register", "edit", "lookup", "verify"];

export default function AdminUsersPage() {
  const router = useRouter();
  const { Get, Patch } = useAxios();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const debouncedSearch = useDebounce(search.trim(), 400);
  const [overviewUser, setOverviewUser] = useState(null);
  const [confirm, setConfirm] = useState(null); // user to toggle
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const load = useCallback(async () => {
    setLoading(true);
    const { response } = await Get({
      route: "users",
      params: {
        page,
        limit: LIMIT,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(status ? { status } : {}),
      },
      showAlert: false,
    });
    setItems(extractItems(response, "users"));
    setTotal(extractTotalRecords(response));
    setLoading(false);
  }, [Get, page, debouncedSearch, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggle = async () => {
    if (!confirm) return;
    setBusy(true);
    const { response } = await Patch({ route: `users/active-inactive/${encodeURIComponent(confirm._id)}` });
    if (response) {
      toast.success(confirm.status === "active" ? "User deactivated" : "User activated");
    }
    setBusy(false);
    setConfirm(null);
    void load();
  };

  const headers = [
    {
      key: "name",
      title: "User",
      renderItem: ({ data }) => (
        <div>
          <RenderGeneralTextCell text={getDisplayName(data)} fontType="medium" />
          <div className={classes.sub}>{data.email}</div>
        </div>
      ),
    },
    {
      key: "company",
      title: "Company",
      renderItem: ({ data }) => <RenderGeneralTextCell text={data.company || "—"} fontType="light" />,
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
            { label: "View overview", onClick: ({ value }) => setOverviewUser(value) },
            {
              label: row.data.status === "active" ? "Deactivate" : "Activate",
              className: row.data.status === "active" ? shared.deleteAction : undefined,
              onClick: ({ value }) => setConfirm(value),
            },
            {
              label: "View API keys",
              onClick: ({ value }) => router.push(`/admin/api-keys?owner=${encodeURIComponent(value._id)}`),
            },
            {
              label: "View assets",
              onClick: ({ value }) => router.push(`/admin/assets?owner=${encodeURIComponent(value._id)}`),
            },
            {
              label: "View verifications",
              onClick: ({ value }) => router.push(`/admin/verifications?requester=${encodeURIComponent(value._id)}`),
            },
          ]}
        />
      ),
    },
  ];

  const hasFilters = Boolean(debouncedSearch || status);

  return (
    <div className={shared.stack}>
      <PageHeader title="Users" subtitle="Every registered platform account. Super-admins are excluded from this list." />

      <div className={shared.toolbar}>
        <div className={shared.filters}>
          <div className={shared.searchWrap}>
            <CustomInput
              value={search}
              setValue={setSearch}
              placeholder="Search name, email, company…"
              leftIcon={<Search size={16} />}
              maxLength={120}
            />
          </div>
          <select className={shared.select} value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <span className={shared.muted}>
          {formatNumber(total)} user{total === 1 ? "" : "s"}
        </span>
      </div>

      {!loading && items.length === 0 ? (
        <EmptyState
          icon={<Users size={22} />}
          title={hasFilters ? "No users match" : "No users yet"}
          description={
            hasFilters ? "Try a different search or status filter." : "Accounts will appear here once people sign up."
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

      <UserOverviewModal user={overviewUser} onClose={() => setOverviewUser(null)} />

      <AreYouSure
        show={Boolean(confirm)}
        setShow={(v) => !v && setConfirm(null)}
        loading={busy}
        text={confirm?.status === "active" ? "Deactivate this user?" : "Activate this user?"}
        message={
          confirm?.status === "active"
            ? `${getDisplayName(confirm)} will no longer be able to sign in. Their API keys keep working until revoked.`
            : `${getDisplayName(confirm)} will be able to sign in again.`
        }
        buttonText={confirm?.status === "active" ? "Deactivate" : "Activate"}
        handleConfirm={handleToggle}
      />
    </div>
  );
}

function UserOverviewModal({ user, onClose }) {
  const { Get } = useAxios();
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState(null);
  const userId = user?._id;

  useEffect(() => {
    if (!userId) {
      setOverview(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { response } = await Get({ route: `admin/users/${encodeURIComponent(userId)}/overview`, showAlert: false });
      if (!cancelled) {
        setOverview(response?.data ?? null);
        setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [Get, userId]);

  if (!user) return null;

  const counts = overview?.counts ?? {};
  const profile = overview?.user ?? user;
  const usageRows = summarizeUsage(overview?.usage);

  const usageHeaders = [
    { key: "event", title: "Event", renderItem: ({ data }) => <RenderGeneralTextCell text={titleCase(data.event)} fontType="medium" /> },
    { key: "count", title: "Requests", renderItem: ({ data }) => <RenderGeneralTextCell text={formatNumber(data.count)} fontType="regular" /> },
    {
      key: "errors",
      title: "Errors",
      renderItem: ({ data }) => (
        <span className={data.errors > 0 ? classes.errorCount : undefined}>{formatNumber(data.errors)}</span>
      ),
    },
  ];

  return (
    <Modal show setShow={onClose} title={getDisplayName(profile)} size="large">
      <KeyValueList
        columns={3}
        dense
        items={[
          { label: "Email", value: profile.email },
          { label: "Company", value: profile.company },
          { label: "Status", value: <StatusBadge status={profile.status} /> },
          { label: "Phone", value: profile.phone },
          { label: "Joined", value: formatDateTime(profile.createdAt) },
          { label: "User id", value: profile._id, mono: true },
        ]}
      />

      {loading ? (
        <div className={shared.loaderRow}>
          <Loader2 className={shared.spin} />
        </div>
      ) : !overview ? (
        <p className={classes.modalMuted}>Overview could not be loaded.</p>
      ) : (
        <>
          <div className={classes.miniStats}>
            <MiniStat icon={<KeyRound size={16} />} label="API keys" value={counts.apiKeys} />
            <MiniStat icon={<Boxes size={16} />} label="Assets" value={counts.assets} />
            <MiniStat icon={<Layers size={16} />} label="Manifests" value={counts.manifests} />
            <MiniStat icon={<Activity size={16} />} label="Verifications" value={counts.verifications} />
          </div>

          <h4 className={classes.subheading}>API usage · last 30 days</h4>
          {usageRows.length === 0 ? (
            <p className={classes.modalMuted}>No API activity in the last 30 days.</p>
          ) : (
            <AppTable data={usageRows} tableHeader={usageHeaders} />
          )}
        </>
      )}
    </Modal>
  );
}

function MiniStat({ icon, label, value }) {
  return (
    <div className={classes.miniStat}>
      <span className={classes.miniIcon}>{icon}</span>
      <div>
        <div className={classes.miniValue}>{formatNumber(value ?? 0)}</div>
        <div className={classes.miniLabel}>{label}</div>
      </div>
    </div>
  );
}

/** Collapse [{day,event,count,errors}] into one row per event. */
function summarizeUsage(usage) {
  if (!Array.isArray(usage) || usage.length === 0) return [];
  const byEvent = new Map();
  for (const row of usage) {
    const key = row.event ?? "unknown";
    const bucket = byEvent.get(key) ?? { event: key, count: 0, errors: 0 };
    bucket.count += row.count ?? 0;
    bucket.errors += row.errors ?? 0;
    byEvent.set(key, bucket);
  }
  return [...byEvent.values()].sort((a, b) => {
    const ia = USAGE_EVENTS.indexOf(a.event);
    const ib = USAGE_EVENTS.indexOf(b.event);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}
