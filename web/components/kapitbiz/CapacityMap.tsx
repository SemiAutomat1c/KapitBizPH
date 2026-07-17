"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CapacityHost } from "@/lib/kapitbiz";
import styles from "./KapitBizRelay.module.css";

export interface CapacityMapProps {
  origin: [number, number];
  hosts: CapacityHost[];
  eligibleHostIds?: string[];
  selectedHostId: string | null;
  onSelectHost: (hostId: string) => void;
}

const originLabel = "Maya's Frozen Goods, Tagum City";

function OfflineSchematic({
  hosts,
  eligibleHostIds,
  selectedHostId,
  onSelectHost,
}: Omit<CapacityMapProps, "origin">) {
  const eligibleIds = new Set(eligibleHostIds);

  return (
    <section className={styles.offlineSchematic} aria-label="Offline route schematic">
      <div className={styles.schematicHeader}>
        <span>Offline route schematic</span>
        <small>Seeded Tagum-Panabo corridor</small>
      </div>
      <div className={styles.schematicRoute} aria-hidden="true">
        <span className={`${styles.schematicStop} ${styles.schematicOrigin}`}>Tagum</span>
        <span className={styles.schematicLine} />
        <span className={`${styles.schematicStop} ${styles.schematicDestination}`}>Panabo</span>
      </div>
      <p className={styles.schematicCaption}>{originLabel} to regional rescue capacity.</p>
      <div className={styles.schematicHostList} aria-label="Hosts on offline schematic">
        {hosts.map((host) => {
          const eligible = eligibleIds.has(host.id);
          return (
            <div className={styles.schematicHost} data-eligible={eligible} key={host.id}>
              <div>
                <strong>{host.name}</strong>
                <span>{host.locality} | {host.distanceKm} km | {host.transferMinutes} min</span>
              </div>
              {eligible ? (
                <button
                  className={styles.secondaryButton}
                  type="button"
                  aria-pressed={selectedHostId === host.id}
                  onClick={() => onSelectHost(host.id)}
                >
                  Select {host.name}
                </button>
              ) : (
                <span className={styles.ineligibleNote}>{host.reason}</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function CapacityMap({ origin, hosts, eligibleHostIds = [], selectedHostId, onSelectHost }: CapacityMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<{ remove: () => void } | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [showFallback, setShowFallback] = useState(!token);
  const selectedHost = useMemo(
    () => hosts.find((host) => host.id === selectedHostId) ?? hosts.find((host) => host.id === "northline") ?? hosts[0],
    [hosts, selectedHostId],
  );

  useEffect(() => {
    if (showFallback || !token || !containerRef.current || !selectedHost) return;

    let cancelled = false;

    const initializeMap = async () => {
      try {
        const mapboxModule = await import("mapbox-gl");
        if (cancelled || !containerRef.current) return;

        const mapboxgl = mapboxModule.default;
        mapboxgl.accessToken = token;
        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/light-v11",
          center: [125.748, 7.369],
          zoom: 10.2,
          attributionControl: false,
        });
        mapRef.current = map;

        map.on("error", () => setShowFallback(true));
        map.on("load", () => {
          if (cancelled) return;
          new mapboxgl.Marker({ color: "#ba1a1a" }).setLngLat(origin).setPopup(new mapboxgl.Popup().setText(originLabel)).addTo(map);
          hosts.forEach((host) => {
            new mapboxgl.Marker({ color: host.id === "northline" ? "#006d77" : "#6f797a" })
              .setLngLat(host.coordinates)
              .setPopup(new mapboxgl.Popup().setText(host.name))
              .addTo(map);
          });
          map.addSource("relay-route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: [origin, selectedHost.coordinates] },
            },
          });
          map.addLayer({
            id: "relay-route-line",
            type: "line",
            source: "relay-route",
            paint: { "line-color": "#006d77", "line-width": 4, "line-dasharray": [2, 2] },
          });
        });
      } catch {
        setShowFallback(true);
      }
    };

    void initializeMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [hosts, origin, selectedHost, showFallback, token]);

  if (showFallback) {
    return <OfflineSchematic hosts={hosts} eligibleHostIds={eligibleHostIds} selectedHostId={selectedHostId} onSelectHost={onSelectHost} />;
  }

  return (
    <section className={styles.mapPresentation} aria-label="Seeded Mapbox capacity map">
      <div ref={containerRef} className={styles.mapCanvas} />
      <p className={styles.mapNotice}>Seeded demo markers and relay route. No live routing or traffic data.</p>
    </section>
  );
}
