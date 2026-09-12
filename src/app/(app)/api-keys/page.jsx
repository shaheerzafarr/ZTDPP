"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, KeyRound, MoreVertical, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/molecules/PageHeader/PageHeader";
import SectionCard from "@/components/molecules/SectionCard/SectionCard";
import EmptyState from "@/components/molecules/EmptyState/EmptyState";
import CustomButton from "@/components/atoms/CustomButton/CustomButton";
import CustomInput from "@/components/atoms/CustomInput/CustomInput";
import TextArea from "@/components/atoms/TextArea/TextArea";
import MenuPopup from "@/components/atoms/MenuPopup/MenuPopup";
import Modal from "@/components/organisms/Modal/Modal";
import AreYouSure from "@/components/organisms/AreYouSure/AreYouSure";
import AppTable from "@/components/organisms/AppTable";
import { RenderGeneralTextCell } from "@/components/organisms/AppTable/tableHelper";
import { StatusBadge, ToneBadge } from "@/components/molecules/ToneBadge/ToneBadge";
import HashChip from "@/components/molecules/HashChip/HashChip";
import CodeBlock from "@/components/molecules/CodeBlock/CodeBlock";
import useAxios from "@/interceptor/useAxios";
import { extractItems, extractTotalRecords } from "@/resources/utils/apiResponse";
import { API_SCOPES } from "@/resources/constants/ztdpp";
import { formatDateTime, formatNumber, timeAgo } from "@/resources/utils/helper";
import shared from "@/styles/shared.module.css";
import classes from "./page.module.css";

const LIMIT = 10;

export default function ApiKeysPage() {
  const { Get, Post, Delete } = useAxios();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [revealed, setRevealed] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type: 'revoke'|'rotate', key }
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { response } = await Get({
      route: "api-keys",
      params: { page, limit: LIMIT, ...(status ? { status } : {}) },
      showAlert: false,
    });
    setItems(extractItems(response));
    setTotal(extractTotalRecords(response));
    setLoading(false);
  }, [page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreated = (data) => {
    setShowCreate(false);
    setRevealed(data);
    void load();
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    setBusy(true);
    if (confirm.type === "revoke") {
      const { response } = await Delete({ route: `api-keys/${confirm.key._id}` });
      if (response) toast.success("API key revoked");
    } else {
      const { response } = await Post({ route: `api-keys/${confirm.key._id}/rotate` });
      if (response?.data) {
        toast.success("Key rotated. Copy the new key now.");
        setRevealed(response.data);
      }
    }
    setBusy(false);
    setConfirm(null);
    void load();
  };

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
              label: "Rotate key",
              disabled: row.data.status !== "active",
              onClick: ({ value }) => setConfirm({ type: "rotate", key: value }),
            },
            {
              label: "Revoke",
              className: shared.deleteAction,
              disabled: row.data.status !== "active",
              onClick: ({ value }) => setConfirm({ type: "revoke", key: value }),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className={shared.stack}>
      <PageHeader
        title="API keys"
        subtitle="Keys authenticate your platform against /provenance and /verify. Secrets are shown once."
        actions={
          <CustomButton onClick={() => setShowCreate(true)} leftIcon={<Plus size={16} />}>
            Create key
          </CustomButton>
        }
      />

      <div className={shared.toolbar}>
        <div className={shared.filters}>
          <select
            className={shared.select}
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>
        <span className={shared.muted}>{total} key{total === 1 ? "" : "s"}</span>
      </div>

      {!loading && items.length === 0 ? (
        <EmptyState
          icon={<KeyRound size={22} />}
          title="No API keys yet"
          description="Create a key to start registering content and verifying images from your own platform."
          action={<CustomButton onClick={() => setShowCreate(true)}>Create your first key</CustomButton>}
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

      <CreateKeyModal show={showCreate} setShow={setShowCreate} onCreated={handleCreated} />

      <RevealKeyModal data={revealed} onClose={() => setRevealed(null)} />

      <AreYouSure
        show={Boolean(confirm)}
        setShow={(v) => !v && setConfirm(null)}
        loading={busy}
        text={confirm?.type === "rotate" ? "Rotate this key?" : "Revoke this key?"}
        message={
          confirm?.type === "rotate"
            ? `"${confirm?.key?.name}" will be revoked immediately and a replacement with the same scopes and limits will be issued.`
            : `"${confirm?.key?.name}" will stop working immediately. Integrations using it will receive 401 responses.`
        }
        buttonText={confirm?.type === "rotate" ? "Rotate" : "Revoke"}
        handleConfirm={handleConfirm}
      />
    </div>
  );
}

function CreateKeyModal({ show, setShow, onCreated }) {
  const { Post } = useAxios();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scopes, setScopes] = useState(API_SCOPES.map((s) => s.value));
  const [rate, setRate] = useState("120");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggle = (value) =>
    setScopes((prev) => (prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]));

  const submit = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!scopes.length) {
      setError("Select at least one scope");
      return;
    }
    setError("");
    setLoading(true);
    const { response } = await Post({
      route: "api-keys",
      data: {
        name: name.trim(),
        description: description.trim() || undefined,
        scopes,
        rateLimitPerMinute: Number(rate) || undefined,
      },
    });
    setLoading(false);
    if (response?.data) {
      setName("");
      setDescription("");
      setScopes(API_SCOPES.map((s) => s.value));
      setRate("120");
      onCreated(response.data);
    }
  };

  return (
    <Modal show={show} setShow={setShow} title="Create API key" size="medium">
      <div className={shared.formGrid}>
        <CustomInput label="Name" value={name} setValue={setName} placeholder="Mobile capture app (prod)" required maxLength={80} />
        <CustomInput label="Rate limit (requests / minute)" type="number" value={rate} setValue={setRate} min={1} max={10000} />
      </div>
      <div style={{ marginTop: 16 }}>
        <TextArea label="Description" value={description} setValue={setDescription} rows={2} maxLength={300} placeholder="Where is this key used?" />
      </div>
      <div style={{ marginTop: 16 }}>
        <span className={shared.fieldLabel}>Scopes</span>
        <div className={shared.checkList}>
          {API_SCOPES.map((s) => (
            <label key={s.value} className={shared.checkItem}>
              <input type="checkbox" checked={scopes.includes(s.value)} onChange={() => toggle(s.value)} />
              <span>
                <span className={shared.checkTitle}>{s.label}</span>
                <br />
                <span className={shared.checkDesc}>
                  {s.description} · <code>{s.value}</code>
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>
      {error && <p className={classes.error}>{error}</p>}
      <div className={shared.formActions}>
        <CustomButton variant="outline" onClick={() => setShow(false)}>
          Cancel
        </CustomButton>
        <CustomButton onClick={submit} loading={loading}>
          Create key
        </CustomButton>
      </div>
    </Modal>
  );
}

function RevealKeyModal({ data, onClose }) {
  if (!data) return null;
  const key = data.plaintextKey;
  const snippet = `curl -X POST ${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5006/api/v1/"}verify \\
  -H "x-api-key: ${key}" \\
  -F "file=@photo.jpg"`;

  return (
    <Modal show setShow={onClose} title={`Key created: ${data.apiKey?.name ?? ""}`} size="medium" closeOnOverlayClick={false}>
      <div className={classes.revealWarning}>
        <AlertTriangle size={18} />
        <span>This is the only time the full key is shown. Store it in your secret manager now.</span>
      </div>
      <div style={{ margin: "16px 0" }}>
        <HashChip value={key} full />
      </div>
      <CodeBlock code={snippet} language="bash" title="Try it" />
      <div className={shared.formActions}>
        <CustomButton onClick={onClose}>I have saved the key</CustomButton>
      </div>
    </Modal>
  );
}
