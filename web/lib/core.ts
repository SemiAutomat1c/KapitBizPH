// Reusable hackathon core: every focus-area idea is just a different AreaConfig.
// intake fields -> a practical "answer" -> an impact number. Swap the config, get a new app.

export type FieldType = "text" | "number" | "select" | "photo" | "location";

export interface Field {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  unit?: string;
}

export type Tone = "ok" | "warn" | "bad";

export interface Answer {
  title: string;
  lines: string[];
  tone: Tone;
}

export interface AreaConfig {
  id: string;
  name: string;
  short: string;
  accent: string; // hex
  intakeTitle: string;
  fields: Field[];
  statuses: string[];
  impactLabel: string; // e.g. "kg banana waste diverted"
  /** numeric contribution to the headline impact metric */
  impact: (v: Vals) => number;
  /** optional second metric (e.g. ₱ volume) */
  secondaryImpactLabel?: string;
  secondaryImpact?: (v: Vals) => number;
  /** the practical answer the app returns to the user */
  answer: (v: Vals) => Answer;
}

export type Vals = Record<string, string>;

export interface Entry {
  id: string;
  areaId: string;
  values: Vals;
  status: string;
  impact: number;
  createdAt: number;
}

// Real Tagum City barangays — makes demos feel local.
export const BARANGAYS = [
  "Apokon", "Bincungan", "Busaon", "Canocotan", "Cuambogan", "La Filipina",
  "Liboganon", "Madaum", "Magdum", "Magugpo East", "Magugpo North",
  "Magugpo Poblacion", "Magugpo South", "Magugpo West", "Mankilam",
  "New Balamban", "Nueva Fuerza", "Pagsabangan", "Pandapan", "San Agustin",
  "San Isidro", "San Miguel", "Visayan Village",
];

const num = (v: Vals, k: string) => Number(v[k] || 0);

/** Indicative Tagum scrap board (demo ranges — not live market quotes). */
export const KILOKITA_BOARD: Record<string, { low: number; mid: number; high: number }> = {
  "PET bottles": { low: 8, mid: 12, high: 15 },
  "Soft plastic": { low: 3, mid: 5, high: 8 },
  "Carton / paper": { low: 2, mid: 4, high: 6 },
  "Aluminum cans": { low: 40, mid: 55, high: 70 },
  "Copper wire": { low: 280, mid: 350, high: 420 },
  "Iron / steel": { low: 8, mid: 12, high: 16 },
  "Glass bottles": { low: 1, mid: 2, high: 3 },
};

function kiloKitaAnswer(v: Vals): Answer {
  const qty = num(v, "qty");
  const paid = num(v, "pricePerKg");
  const board = KILOKITA_BOARD[v.material] ?? { low: 5, mid: 10, high: 15 };
  const total = Math.round(qty * paid);
  const fairTotal = Math.round(qty * board.mid);
  const marginIfResellMid = Math.round(qty * (board.mid - paid));

  let tone: Tone = "ok";
  let title: string;
  const lines: string[] = [];

  if (!qty || !paid) {
    return {
      title: "Kulang ang data",
      lines: ["Ilagay ang kg at ₱/kg para sa fair-price check."],
      tone: "warn",
    };
  }

  if (paid > board.high) {
    tone = "bad";
    title = `Mahal ang bili — ₱${paid}/kg`;
    lines.push(
      `Board range for ${v.material}: ₱${board.low}–${board.high}/kg (mid ₱${board.mid}).`,
      `Binayaran mo: ₱${total.toLocaleString()} for ${qty} kg — ~₱${(total - fairTotal).toLocaleString()} above mid board.`,
      "Tip: bawasan ang offer next load, o i-check ang moisture/contaminants.",
    );
  } else if (paid < board.low) {
    tone = "warn";
    title = `Mura ang bili — ₱${paid}/kg`;
    lines.push(
      `Board range: ₱${board.low}–${board.high}/kg. Good margin kung malinis ang load.`,
      `Total out: ₱${total.toLocaleString()} · Est. mid resell: ₱${fairTotal.toLocaleString()}.`,
      "Tip: i-inspect — sobrang mura minsan = basang plastic o mixed waste.",
    );
  } else {
    tone = "ok";
    title = `Fair buy — ₱${paid}/kg`;
    lines.push(
      `Board: ₱${board.low}–${board.high}/kg (mid ₱${board.mid}). Nasa range ka.`,
      `Total paid: ₱${total.toLocaleString()} for ${qty} kg from ${v.source || "source"}.`,
      marginIfResellMid >= 0
        ? `If resell near mid: ~₱${marginIfResellMid.toLocaleString()} spread before hauling.`
        : `Spread thin vs mid — prioritize clean loads.`,
    );
  }

  lines.push(`Logged for ${v.shop || "junkshop"} · ${v.barangay || "Tagum"}.`);
  return { title, lines, tone };
}

export const AREAS: AreaConfig[] = [
  {
    // KapitBiz Relay has its own bespoke rescue-flow UI.
    // instead of the generic intake-form pattern — this entry only supplies tab
    // metadata (name/short/accent). fields/answer are unused stubs to satisfy the type.
    id: "resilience",
    name: "KapitBiz Relay",
    short: "Business Continuity & Disaster Resiliency",
    accent: "#A33A2A",
    intakeTitle: "KapitBiz Relay",
    statuses: ["At risk", "Rescued"],
    impactLabel: "₱ value protected",
    fields: [],
    impact: () => 0,
    answer: () => ({ title: "", lines: [], tone: "ok" }),
  },
  {
    id: "agri",
    name: "BanaLoop Tagum",
    short: "Circular Agriculture & Agribusiness",
    accent: "#17813F",
    intakeTitle: "List banana waste and get matched to a buyer",
    statuses: ["Listed", "Matched", "Collected"],
    impactLabel: "kg banana waste diverted",
    fields: [
      { key: "material", label: "Material", type: "select", options: ["Pseudostem", "Leaves", "Reject fruit", "Peels"] },
      { key: "qty", label: "Quantity", type: "number", unit: "kg", placeholder: "120" },
      { key: "barangay", label: "Barangay", type: "location" },
      { key: "photo", label: "Photo", type: "photo" },
    ],
    impact: (v) => num(v, "qty"),
    answer: (v) => {
      const map: Record<string, [string, number]> = {
        "Pseudostem": ["Fiber maker — Madaum Weavers", 6],
        "Leaves": ["Eco-packaging maker — Apokon Print Co-op", 4],
        "Reject fruit": ["Chips/flour processor — San Miguel", 5],
        "Peels": ["BSF/compost operator", 2],
      };
      const [buyer, price] = map[v.material] || ["Compost operator", 2];
      const value = num(v, "qty") * price;
      return {
        title: `Matched: ${buyer}`,
        lines: [`Est. value: ₱${value.toLocaleString()} (₱${price}/kg)`, `Diverts ${num(v, "qty")} kg from waste.`],
        tone: "ok",
      };
    },
  },
  {
    id: "waste",
    name: "KiloKita",
    short: "Waste-to-Value · Junkshop ops",
    accent: "#B8860B",
    intakeTitle: "Log a scrap buy — get fair price + stock note",
    statuses: ["Bought", "Stocked", "Sold upstream"],
    impactLabel: "kg scrap processed",
    secondaryImpactLabel: "₱ buy volume",
    fields: [
      { key: "shop", label: "Junkshop name", type: "text", placeholder: "Apokon Scrap Yard" },
      {
        key: "material",
        label: "Material",
        type: "select",
        options: [
          "PET bottles",
          "Soft plastic",
          "Carton / paper",
          "Aluminum cans",
          "Copper wire",
          "Iron / steel",
          "Glass bottles",
        ],
      },
      { key: "qty", label: "Weight", type: "number", unit: "kg", placeholder: "42" },
      { key: "pricePerKg", label: "Price you paid", type: "number", unit: "₱/kg", placeholder: "12" },
      {
        key: "source",
        label: "Source",
        type: "select",
        options: ["Public market", "Household", "Barangay MRF", "Other junkshop", "Walk-in"],
      },
      { key: "barangay", label: "Barangay", type: "location" },
      { key: "photo", label: "Photo of load (optional)", type: "photo" },
    ],
    impact: (v) => num(v, "qty"),
    secondaryImpact: (v) => Math.round(num(v, "qty") * num(v, "pricePerKg")),
    answer: (v) => kiloKitaAnswer(v),
  },
  {
    id: "aqua",
    name: "BantayPond",
    short: "Aquaculture & Fisheries Innovation",
    accent: "#22707E",
    intakeTitle: "Log a water reading and get an alert",
    statuses: ["Logged", "Action taken"],
    impactLabel: "water readings logged",
    fields: [
      { key: "pond", label: "Pond", type: "text", placeholder: "Pond 2 — Bincungan" },
      { key: "temp", label: "Temperature", type: "number", unit: "°C", placeholder: "29.4" },
      { key: "ph", label: "pH", type: "number", placeholder: "6.1" },
      { key: "turbidity", label: "Turbidity", type: "number", unit: "NTU", placeholder: "38" },
    ],
    impact: () => 1,
    answer: (v) => {
      const ph = num(v, "ph"), temp = num(v, "temp"), turb = num(v, "turbidity");
      const alerts: string[] = [];
      let tone: Tone = "ok";
      if (ph && (ph < 6.5 || ph > 9)) { alerts.push(`pH ${ph}: mag-apply ng agri lime, recheck in 6h.`); tone = "bad"; }
      if (temp > 32) { alerts.push(`Temp ${temp}°C: dagdagan ang aeration.`); if (tone !== "bad") tone = "warn"; }
      if (turb > 50) { alerts.push(`Turbidity ${turb} NTU: bawasan muna ang feeding.`); if (tone !== "bad") tone = "warn"; }
      return {
        title: tone === "ok" ? "Water is safe" : "Action needed",
        lines: alerts.length ? alerts : ["All parameters within safe range."],
        tone,
      };
    },
  },
];

export const areaById = (id: string) => AREAS.find((a) => a.id === id) || AREAS[0];

// Seed data so demos never open empty.
export function seed(): Entry[] {
  const t = Date.now();
  const mk = (areaId: string, values: Vals, status: string, ageMin: number): Entry => {
    const a = areaById(areaId);
    return { id: `seed-${areaId}-${ageMin}`, areaId, values, status, impact: a.impact(values), createdAt: t - ageMin * 60000 };
  };
  return [
    mk("agri", { material: "Pseudostem", qty: "120", barangay: "Madaum" }, "Matched", 30),
    mk("agri", { material: "Pseudostem", qty: "240", barangay: "Liboganon" }, "Matched", 75),
    mk("agri", { material: "Reject fruit", qty: "90", barangay: "Visayan Village" }, "Listed", 90),
    mk("agri", { material: "Reject fruit", qty: "45", barangay: "San Miguel" }, "Listed", 150),
    mk("agri", { material: "Peels", qty: "60", barangay: "Mankilam" }, "Collected", 260),
    mk("agri", { material: "Leaves", qty: "30", barangay: "Apokon" }, "Collected", 300),
    mk("waste", { shop: "Apokon Scrap Yard", material: "PET bottles", qty: "48", pricePerKg: "11", source: "Public market", barangay: "Apokon" }, "Stocked", 18),
    mk("waste", { shop: "Apokon Scrap Yard", material: "Aluminum cans", qty: "12", pricePerKg: "52", source: "Household", barangay: "Magugpo East" }, "Bought", 45),
    mk("waste", { shop: "Mankilam Metals", material: "Iron / steel", qty: "95", pricePerKg: "14", source: "Barangay MRF", barangay: "Mankilam" }, "Sold upstream", 90),
    mk("waste", { shop: "Visayan Village Junk", material: "Copper wire", qty: "3.5", pricePerKg: "380", source: "Walk-in", barangay: "Visayan Village" }, "Stocked", 130),
    mk("waste", { shop: "Apokon Scrap Yard", material: "Carton / paper", qty: "60", pricePerKg: "3", source: "Public market", barangay: "Apokon" }, "Bought", 200),
    mk("waste", { shop: "La Filipina Recycle", material: "Soft plastic", qty: "28", pricePerKg: "9", source: "Household", barangay: "La Filipina" }, "Bought", 260),
    mk("aqua", { pond: "Pond 2 — Bincungan", temp: "29.4", ph: "6.1", turbidity: "38" }, "Logged", 15),
    mk("aqua", { pond: "Pond 5 — Liboganon", temp: "30.1", ph: "7.2", turbidity: "22" }, "Action taken", 180),
    mk("aqua", { pond: "Pond 1 — Busaon", temp: "31.8", ph: "7.0", turbidity: "55" }, "Action taken", 240),
    mk("aqua", { pond: "Pond 3 — Bincungan", temp: "28.9", ph: "7.4", turbidity: "18" }, "Logged", 320),
  ];
}
