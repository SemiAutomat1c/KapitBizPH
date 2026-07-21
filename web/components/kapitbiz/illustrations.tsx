// Swapped inline SVGs for actual PNG assets dropped in /public/illustrations.
// TransportBadge remains a fallback vector as no specific image was provided for it.

const FLAG_BLUE = "#0038A8";
const FLAG_RED = "#CE1126";
const FLAG_GOLD = "#FCD116";
const CREAM = "#FFF6E0";
const INK = "#181c1d";

export function ProtectIllustration() {
  return (
    <img
      src="/illustrations/onboarding-protect.png"
      alt="A storefront protected by a shield"
    />
  );
}

export function RelayIllustration() {
  return (
    <img
      src="/illustrations/onboarding-relay.png"
      alt="A relay route from a shop to a storage warehouse"
    />
  );
}

export function VerifyIllustration() {
  return (
    <img
      src="/illustrations/onboarding-verify.png"
      alt="A verified QR handoff of a package"
    />
  );
}

export function BusinessIllustration() {
  return (
    <img
      src="/illustrations/onboarding-business.png"
      alt="A stocked frozen-goods cold storage cabinet"
    />
  );
}

export function RoleMerchantIllustration() {
  return (
    <img
      src="/illustrations/role-merchant.png"
      alt="Merchant storefront icon"
      style={{ width: "100%", height: "100%", objectFit: "contain" }}
    />
  );
}

export function RoleHostIllustration() {
  return (
    <img
      src="/illustrations/role-host.png"
      alt="Storage host warehouse icon"
      style={{ width: "100%", height: "100%", objectFit: "contain" }}
    />
  );
}

export function RoleRiderIllustration() {
  return (
    <img
      src="/illustrations/role-rider.png"
      alt="Rider motorbike icon"
      style={{ width: "100%", height: "100%", objectFit: "contain" }}
    />
  );
}

export function HomeBannerIllustration() {
  return (
    <img
      src="/illustrations/home-banner.png"
      alt="Business connected to a relay network of nearby capacity"
      style={{ width: "100%", height: "100%", objectFit: "contain" }}
    />
  );
}

export function ColdStorageBadge() {
  return (
    <img
      src="/illustrations/badge-cold-storage.png"
      alt="Cold storage host"
      style={{ width: "100%", height: "100%", objectFit: "contain" }}
    />
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
    <img
      src="/illustrations/empty-requests.png"
      alt="No active rescue requests"
      style={{ width: "100%", height: "100%", objectFit: "contain" }}
    />
  );
}
