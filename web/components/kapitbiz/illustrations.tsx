// Hand-built flat-vector placeholders in the eGovPH flag palette (blue/red/gold).
// Swap for generated art later by dropping PNGs in /public/illustrations and
// replacing the relevant <XIllustration /> usage with an <img>.
const FLAG_BLUE = "#0038A8";
const FLAG_RED = "#CE1126";
const FLAG_GOLD = "#FCD116";
const CREAM = "#FFF6E0";
const INK = "#181c1d";

function Sunburst({ cx, cy, r, opacity = 0.5 }: { cx: number; cy: number; r: number; opacity?: number }) {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const x1 = cx + Math.cos(angle) * r;
    const y1 = cy + Math.sin(angle) * r;
    const x2 = cx + Math.cos(angle) * r * 1.4;
    const y2 = cy + Math.sin(angle) * r * 1.4;
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={FLAG_GOLD} strokeWidth={r * 0.14} strokeLinecap="round" />;
  });
  return (
    <g opacity={opacity}>
      {rays}
      <circle cx={cx} cy={cy} r={r} fill={FLAG_GOLD} />
    </g>
  );
}

function Storefront({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x={0} y={20} width={70} height={40} rx={3} fill={FLAG_BLUE} />
      <rect x={-4} y={12} width={78} height={11} rx={2} fill={FLAG_RED} />
      <rect x={8} y={30} width={16} height={16} rx={2} fill={CREAM} />
      <rect x={46} y={30} width={16} height={16} rx={2} fill={CREAM} />
      <rect x={28} y={38} width={14} height={22} rx={1.5} fill={FLAG_GOLD} />
    </g>
  );
}

export function ProtectIllustration() {
  return (
    <svg viewBox="0 0 200 160" width="100%" height="100%" role="img" aria-label="A storefront protected by a shield">
      <Sunburst cx={130} cy={40} r={26} />
      <Storefront x={35} y={70} />
      <g transform="translate(118 34)">
        <path d="M0 0 L34 0 L34 24 Q34 46 17 56 Q0 46 0 24 Z" fill={FLAG_BLUE} stroke="#fff" strokeWidth={2} />
        <path d="M8 24 L15 32 L27 14" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export function RelayIllustration() {
  return (
    <svg viewBox="0 0 240 150" width="100%" height="100%" role="img" aria-label="A relay route from a shop to a storage warehouse">
      <Storefront x={8} y={78} scale={0.72} />
      <g transform="translate(178 55)">
        <rect x={0} y={0} width={55} height={55} rx={4} fill={FLAG_BLUE} />
        <rect x={15} y={16} width={25} height={34} rx={2} fill={FLAG_GOLD} />
        <rect x={15} y={24} width={25} height={3} fill={FLAG_BLUE} />
        <rect x={15} y={32} width={25} height={3} fill={FLAG_BLUE} />
      </g>
      <line x1={68} y1={100} x2={178} y2={100} stroke={FLAG_GOLD} strokeWidth={3} strokeDasharray="2 9" strokeLinecap="round" />
      <g transform="translate(95 82)">
        <rect x={0} y={10} width={30} height={18} rx={2} fill={FLAG_RED} />
        <rect x={30} y={0} width={20} height={28} rx={2} fill={FLAG_RED} />
        <rect x={34} y={5} width={12} height={10} rx={1} fill={CREAM} />
        <circle cx={9} cy={30} r={5} fill={INK} />
        <circle cx={40} cy={30} r={5} fill={INK} />
        <line x1={-10} y1={12} x2={-2} y2={12} stroke={FLAG_BLUE} strokeWidth={2} strokeLinecap="round" />
        <line x1={-14} y1={20} x2={-4} y2={20} stroke={FLAG_BLUE} strokeWidth={2} strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function VerifyIllustration() {
  return (
    <svg viewBox="0 0 200 160" width="100%" height="100%" role="img" aria-label="A verified QR handoff of a package">
      <g transform="translate(70 20)">
        <rect x={0} y={0} width={60} height={60} rx={8} fill={FLAG_BLUE} />
        {[0, 1, 2].flatMap((row) =>
          [0, 1, 2].map((col) => (
            <rect key={`${row}-${col}`} x={10 + col * 15} y={10 + row * 15} width={9} height={9} rx={1.5} fill={(row + col) % 2 === 0 ? FLAG_GOLD : "#fff"} />
          )),
        )}
      </g>
      <g transform="translate(70 95)">
        <rect x={0} y={0} width={60} height={38} rx={5} fill={FLAG_GOLD} />
        <rect x={0} y={15} width={60} height={8} fill={FLAG_RED} />
      </g>
      <path d="M20 120 L58 108" stroke={FLAG_RED} strokeWidth={5} strokeLinecap="round" />
      <path d="M180 120 L142 108" stroke={FLAG_BLUE} strokeWidth={5} strokeLinecap="round" />
    </svg>
  );
}

export function BusinessIllustration() {
  return (
    <svg viewBox="0 0 200 160" width="100%" height="100%" role="img" aria-label="A stocked frozen-goods cold storage cabinet">
      <rect x={55} y={20} width={90} height={120} rx={12} fill={FLAG_BLUE} />
      <rect x={66} y={34} width={68} height={92} rx={6} fill={CREAM} />
      <rect x={66} y={68} width={68} height={4} fill={FLAG_GOLD} />
      <rect x={66} y={98} width={68} height={4} fill={FLAG_GOLD} />
      <rect x={74} y={44} width={16} height={20} rx={2} fill={FLAG_RED} />
      <rect x={96} y={44} width={16} height={20} rx={2} fill={FLAG_GOLD} />
      <rect x={74} y={76} width={16} height={18} rx={2} fill={FLAG_GOLD} />
      <rect x={96} y={76} width={16} height={18} rx={2} fill={FLAG_RED} />
      <g transform="translate(100 14)" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
        <line x1={-9} y1={0} x2={9} y2={0} />
        <line x1={0} y1={-9} x2={0} y2={9} />
        <line x1={-6.5} y1={-6.5} x2={6.5} y2={6.5} />
        <line x1={-6.5} y1={6.5} x2={6.5} y2={-6.5} />
      </g>
      <rect x={62} y={140} width={10} height={8} rx={2} fill={INK} />
      <rect x={128} y={140} width={10} height={8} rx={2} fill={INK} />
    </svg>
  );
}

export function RoleMerchantIllustration() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" role="img" aria-label="Merchant storefront icon">
      <polygon points="18,42 50,16 82,42" fill={FLAG_RED} />
      <rect x={22} y={42} width={56} height={40} rx={3} fill={FLAG_BLUE} />
      <rect x={42} y={58} width={16} height={24} rx={2} fill={FLAG_GOLD} />
      <rect x={28} y={50} width={12} height={10} rx={1.5} fill={CREAM} />
      <rect x={60} y={50} width={12} height={10} rx={1.5} fill={CREAM} />
    </svg>
  );
}

export function RoleHostIllustration() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" role="img" aria-label="Storage host warehouse icon">
      <rect x={18} y={26} width={64} height={54} rx={5} fill={FLAG_BLUE} />
      <rect x={12} y={20} width={76} height={10} rx={2} fill={FLAG_GOLD} />
      <rect x={34} y={42} width={32} height={38} rx={3} fill={FLAG_RED} />
      <line x1={34} y1={52} x2={66} y2={52} stroke={FLAG_GOLD} strokeWidth={2.5} />
      <line x1={34} y1={62} x2={66} y2={62} stroke={FLAG_GOLD} strokeWidth={2.5} />
      <line x1={34} y1={72} x2={66} y2={72} stroke={FLAG_GOLD} strokeWidth={2.5} />
    </svg>
  );
}

export function RoleRiderIllustration() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" role="img" aria-label="Rider motorbike icon">
      <circle cx={28} cy={72} r={13} fill="none" stroke={INK} strokeWidth={5} />
      <circle cx={72} cy={72} r={13} fill="none" stroke={INK} strokeWidth={5} />
      <path d="M28 72 L46 46 L64 46 L72 72" fill="none" stroke={FLAG_BLUE} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      <rect x={58} y={30} width={22} height={18} rx={3} fill={FLAG_RED} />
      <path d="M46 46 L38 34" stroke={FLAG_BLUE} strokeWidth={6} strokeLinecap="round" />
      <polygon points="20,58 4,50 4,62" fill={FLAG_GOLD} opacity={0.75} />
    </svg>
  );
}

export function HomeBannerIllustration() {
  return (
    <svg viewBox="0 0 400 140" width="100%" height="100%" role="img" aria-label="Business connected to a relay network of nearby capacity">
      <Sunburst cx={340} cy={30} r={22} opacity={0.35} />
      <Storefront x={18} y={62} scale={0.85} />
      <line x1={90} y1={86} x2={230} y2={70} stroke={FLAG_GOLD} strokeWidth={3} strokeDasharray="2 8" strokeLinecap="round" />
      <line x1={90} y1={86} x2={220} y2={104} stroke={FLAG_GOLD} strokeWidth={3} strokeDasharray="2 8" strokeLinecap="round" />
      <g transform="translate(232 48)">
        <rect x={0} y={0} width={38} height={38} rx={4} fill={FLAG_BLUE} />
        <rect x={9} y={9} width={20} height={24} rx={2} fill={FLAG_GOLD} />
      </g>
      <g transform="translate(300 88)">
        <circle cx={16} cy={16} r={16} fill={FLAG_RED} opacity={0.9} />
        <circle cx={16} cy={16} r={6} fill={CREAM} />
      </g>
    </svg>
  );
}

export function ColdStorageBadge() {
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" role="img" aria-label="Cold storage host">
      <rect x={4} y={4} width={56} height={56} rx={14} fill={CREAM} />
      <rect x={16} y={18} width={32} height={30} rx={4} fill={FLAG_BLUE} />
      <g transform="translate(32 33)" stroke="#fff" strokeWidth={2.2} strokeLinecap="round">
        <line x1={-7} y1={0} x2={7} y2={0} />
        <line x1={0} y1={-7} x2={0} y2={7} />
        <line x1={-5} y1={-5} x2={5} y2={5} />
        <line x1={-5} y1={5} x2={5} y2={-5} />
      </g>
      <rect x={16} y={44} width={32} height={4} fill={FLAG_GOLD} />
    </svg>
  );
}

export function TransportBadge() {
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" role="img" aria-label="Transport partner">
      <rect x={4} y={4} width={56} height={56} rx={14} fill={CREAM} />
      <rect x={13} y={30} width={20} height={13} rx={2} fill={FLAG_BLUE} />
      <rect x={33} y={22} width={14} height={21} rx={2} fill={FLAG_RED} />
      <rect x={36} y={26} width={8} height={7} rx={1} fill={CREAM} />
      <circle cx={20} cy={45} r={4} fill={INK} />
      <circle cx={41} cy={45} r={4} fill={INK} />
      <line x1={8} y1={33} x2={13} y2={33} stroke={FLAG_GOLD} strokeWidth={2} strokeLinecap="round" />
      <line x1={6} y1={38} x2={13} y2={38} stroke={FLAG_GOLD} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export function EmptyRequestsIllustration() {
  return (
    <svg viewBox="0 0 200 150" width="100%" height="100%" role="img" aria-label="No active rescue requests">
      <Sunburst cx={140} cy={30} r={20} opacity={0.4} />
      <Storefront x={38} y={68} scale={0.85} />
      <g transform="translate(112 30)">
        <path d="M0 0 L30 0 L30 21 Q30 40 15 49 Q0 40 0 21 Z" fill={FLAG_BLUE} stroke="#fff" strokeWidth={2} />
        <path d="M7 21 L13 28 L24 12" fill="none" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
