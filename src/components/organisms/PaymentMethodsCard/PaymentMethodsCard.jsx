"use client";
import CustomButton from "@/components/atoms/CustomButton/CustomButton";
import AreYouSure from "@/components/organisms/AreYouSure/AreYouSure";
import useAxios from "@/interceptor/useAxios";
import { extractItems } from "@/resources/utils/apiResponse";
import { Check, CreditCard, Loader2, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import classes from "./PaymentMethodsCard.module.css";

const capitalizeBrand = (brand) => !brand ? "Card" : brand.charAt(0).toUpperCase() + brand.slice(1);

function PaymentMethodRow({ pm, isDefault, isSettingDefault, isDeleting, isBusy, onSetDefault, onDelete }) {
  const brand = capitalizeBrand(pm.card?.display_brand || pm.card?.brand);
  const last4 = pm.card?.last4 ?? "****";
  return (
    <div className={cn(classes.row, isDefault && classes.rowDefault, !isDefault && !isBusy && classes.rowSelectable)}
      onClick={() => { if (!isDefault && !isBusy) onSetDefault(pm.id); }}>
      <div className={classes.brandIcon}><CreditCard className={classes.cardIcon} /></div>
      <div className={classes.rowInfo}>
        <p className={classes.brandLine}>{brand} •••• {last4}</p>
        {pm.billing_details?.name && <p className={classes.holderName}>{pm.billing_details.name}</p>}
        {pm.card?.exp_month && pm.card?.exp_year && <p className={classes.expiry}>Expires {pm.card.exp_month}/{pm.card.exp_year}</p>}
      </div>
      <div className={classes.rowActions}>
        {isSettingDefault ? <Loader2 className={classes.spinnerPrimary} /> : isDefault && (
          <span className={classes.defaultBadge}><Check className={classes.badgeIcon} /> Default</span>
        )}
        {isDeleting ? <Loader2 className={classes.spinnerDestructive} /> : (
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(pm.id); }} disabled={isBusy}
            className={classes.deleteButton} aria-label={`Remove ${brand} card ending in ${last4}`}>
            <Trash2 className={classes.deleteIcon} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function PaymentMethodsCard() {
  const { Get, Post, Patch, Delete } = useAxios();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settingDefaultId, setSettingDefaultId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [addCardLoading, setAddCardLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const isBusy = Boolean(settingDefaultId || deletingId || addCardLoading);

  const fetchCards = useCallback(async (showFullLoader = true) => {
    if (showFullLoader) setLoading(true);
    const { response } = await Get({ route: "users/payment-methods", showAlert: false });
    if (response) setCards(extractItems(response));
    if (showFullLoader) setLoading(false);
  }, []);

  useEffect(() => { void fetchCards(); }, [fetchCards]);

  const handleAddCard = async () => {
    if (isBusy) return;
    setAddCardLoading(true);
    const { response } = await Post({ route: "users/payment-methods/setup-session" });
    const checkoutUrl = response?.data;
    if (checkoutUrl) { window.open(checkoutUrl, "_self"); return; }
    toast.error("Failed to setup payment method. Please try again.");
    setAddCardLoading(false);
  };

  const handleSetDefault = async (pmId) => {
    if (settingDefaultId || deletingId) return;
    setSettingDefaultId(pmId);
    const { response } = await Patch({ route: `users/payment-methods/${pmId}/default` });
    if (response) { toast.success("Your default payment card has been updated."); await fetchCards(false); }
    setSettingDefaultId(null);
  };

  const handleConfirmDelete = async () => {
    const pmId = confirmDeleteId;
    if (!pmId) return;
    setConfirmDeleteId(null);
    setDeletingId(pmId);
    const { response } = await Delete({ route: `users/payment-methods/${pmId}`, showAlert: true });
    if (response) { toast.success("Your payment card has been removed."); await fetchCards(false); }
    setDeletingId(null);
  };

  const defaultPmId = cards[0]?.defaultPmId;
  const deleteMessage = cards.length <= 1 ? "This is your only saved card and may be required for subscription billing. Add a replacement card first if billing is active." : "Are you sure you want to remove this payment card?";

  return (
    <div>
      <div className={classes.header}>
        <h3 className={classes.title}>Payment Methods</h3>
        <CustomButton variant="primary" onClick={() => void handleAddCard()} disabled={isBusy}>
          <Plus size={16} />{addCardLoading ? "Loading..." : "Add Card"}
        </CustomButton>
      </div>
      {loading ? (
        <div className={classes.loaderWrap}><Loader2 className={classes.loader} /></div>
      ) : cards.length === 0 ? (
        <div className={classes.empty}><CreditCard className={classes.emptyIcon} /><p className={classes.emptyText}>No saved cards</p></div>
      ) : (
        <div className={classes.list}>
          {cards.map((pm) => (
            <PaymentMethodRow key={pm.id} pm={pm} isDefault={pm.id === (pm.defaultPmId ?? defaultPmId)} isSettingDefault={settingDefaultId === pm.id} isDeleting={deletingId === pm.id} isBusy={isBusy} onSetDefault={(id) => void handleSetDefault(id)} onDelete={setConfirmDeleteId} />
          ))}
        </div>
      )}
      <AreYouSure show={Boolean(confirmDeleteId)} setShow={(next) => { if (!next) setConfirmDeleteId(null); }} text="Remove Card" message={deleteMessage} buttonText="Remove" handleConfirm={() => void handleConfirmDelete()} />
    </div>
  );
}
