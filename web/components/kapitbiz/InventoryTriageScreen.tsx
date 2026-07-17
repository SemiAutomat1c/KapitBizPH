import type { Dispatch } from "react";
import { Minus, Network, Plus } from "lucide-react";
import type {
  InventoryItem,
  RelayAction,
  RelayDemoState,
  RelaySelection,
} from "@/lib/kapitbiz";
import styles from "./KapitBizRelay.module.css";

function formatCurrency(value: number): string {
  return `₱${value.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}

function formatWeight(value: number): string {
  return value.toLocaleString("en-PH", { maximumFractionDigits: 2 });
}

function formatRescueWindow(minutes: number | null): string {
  if (minutes === null) return "Safe without refrigeration";
  if (minutes < 120) return `Rescue within ${minutes} min`;
  if (minutes % 60 === 0) return `Rescue within ${minutes / 60} hours`;
  return `Rescue within ${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
}

function selectedItemValue(item: InventoryItem): number {
  return item.selected
    ? item.selectedQuantity * item.unitValue
    : item.totalValue;
}

interface InventoryTriageScreenProps {
  state: RelayDemoState;
  selection: RelaySelection;
  dispatch: Dispatch<RelayAction>;
}

export default function InventoryTriageScreen({
  state,
  selection,
  dispatch,
}: InventoryTriageScreenProps) {
  const canContinue = selection.selectedGroups > 0;

  return (
    <section className={styles.triageScreen} aria-labelledby="triage-heading">
      <header className={styles.triageIntro}>
        <p className={styles.eyebrow}>Inventory rescue</p>
        <h2 id="triage-heading">Inventory triage</h2>
        <p>
          Prioritize stock for immediate transfer to verified cold storage.
        </p>
      </header>

      <ul className={styles.inventoryList} aria-label="Inventory groups">
        {state.inventory.map((item) => (
          <li
            className={styles.inventoryRow}
            data-selected={item.selected}
            key={item.id}
          >
            <label className={styles.inventoryCheckbox}>
              <input
                type="checkbox"
                checked={item.selected}
                aria-label={`Select ${item.name} for rescue`}
                onChange={() => dispatch({ type: "toggle-item", itemId: item.id })}
              />
            </label>

            <div className={styles.inventoryDetails}>
              <h3 id={`${item.id}-name`}>{item.name}</h3>
              <span
                className={styles.rescueBadge}
                data-safe={item.rescueWindowMinutes === null}
                data-urgent={item.rescueWindowMinutes !== null && item.rescueWindowMinutes <= 90}
              >
                {formatRescueWindow(item.rescueWindowMinutes)}
              </span>

              <div
                className={styles.quantityControl}
                role="group"
                aria-labelledby={`${item.id}-name ${item.id}-quantity-label`}
              >
                <span className={styles.visuallyHidden} id={`${item.id}-quantity-label`}>
                  quantity
                </span>
                <button
                  type="button"
                  aria-label={`Decrease ${item.name} quantity`}
                  disabled={!item.selected || item.selectedQuantity <= 0}
                  onClick={() =>
                    dispatch({
                      type: "set-quantity",
                      itemId: item.id,
                      quantity: item.selectedQuantity - 1,
                    })
                  }
                >
                  <Minus aria-hidden="true" />
                </button>
                <output
                  aria-label={`${item.name} selected quantity: ${item.selectedQuantity} ${item.unit}`}
                >
                  {item.selectedQuantity}
                </output>
                <button
                  type="button"
                  aria-label={`Increase ${item.name} quantity`}
                  disabled={!item.selected || item.selectedQuantity >= item.availableQuantity}
                  onClick={() =>
                    dispatch({
                      type: "set-quantity",
                      itemId: item.id,
                      quantity: item.selectedQuantity + 1,
                    })
                  }
                >
                  <Plus aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className={styles.inventoryValue}>
              <strong>{formatCurrency(selectedItemValue(item))}</strong>
              <span>
                {item.selected
                  ? `${item.selectedQuantity} of ${item.availableQuantity} ${item.unit}`
                  : `${item.availableQuantity} ${item.unit} available`}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <aside className={styles.triageAction} aria-label="Selected for rescue">
        <div
          className={styles.triageSummary}
          role="status"
          aria-label="Selected for rescue"
          aria-live="polite"
        >
          <div>
            <span>Selected for rescue</span>
            <strong>
              {formatWeight(selection.selectedWeightKg)} kg | {formatCurrency(selection.selectedValue)}
            </strong>
          </div>
          <p>{selection.selectedGroups} {selection.selectedGroups === 1 ? "group" : "groups"}</p>
        </div>
        {!canContinue ? (
          <p className={styles.triageHint}>Select at least one inventory group to continue.</p>
        ) : null}
        <button
          className={styles.primaryButton}
          type="button"
          disabled={!canContinue}
          onClick={() => dispatch({ type: "go-to", step: "capacity" })}
        >
          <Network aria-hidden="true" />
          Find rescue capacity
        </button>
      </aside>
    </section>
  );
}
