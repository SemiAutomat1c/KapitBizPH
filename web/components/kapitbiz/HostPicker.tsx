"use client";
import type { ReactNode } from "react";
import type { Host, HostIcon, StockItem } from "@/lib/kapitbiz";

const ICONS: Record<HostIcon, ReactNode> = {
  freezer: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M5 10h14M9 6v1M9 14v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  bolt: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  box: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M3 8l9-5 9 5v8l-9 5-9-5V8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M3 8l9 5 9-5" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  truck: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="7" cy="18" r="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="17" cy="18" r="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
};

export default function HostPicker({
  item,
  hosts,
  onBack,
  onPick,
}: {
  item: StockItem;
  hosts: Host[];
  onBack: () => void;
  onPick: (hostId: string) => void;
}) {
  return (
    <div className="relay-screen">
      <button className="relay-back" onClick={onBack}>
        ← Back
      </button>
      <h2>Reserve capacity</h2>
      <p className="hint">
        For <b>{item.name}</b> (₱{item.value.toLocaleString()}). Nearby pilot-cluster hosts with space right now.
      </p>
      <div className="relay-cluster-note">{hosts.length} of {hosts.length} pilot partners available</div>

      {hosts.map((host) => (
        <div className="relay-host" key={host.id} onClick={() => onPick(host.id)}>
          <span className="relay-host-icon">{ICONS[host.icon]}</span>
          <div className="relay-host-body">
            <div className="n">{host.name}</div>
            <div className="m">{host.meta}</div>
            <div className="w">{host.why}</div>
            <span className="relay-vetted">Chamber-Vetted</span>
          </div>
        </div>
      ))}
    </div>
  );
}
