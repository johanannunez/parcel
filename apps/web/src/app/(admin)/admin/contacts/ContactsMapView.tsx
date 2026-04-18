'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Map, {
  Marker,
  Popup,
  NavigationControl,
  type MapRef,
} from 'react-map-gl/mapbox';
import Supercluster from 'supercluster';
import { House, ListBullets, X } from '@phosphor-icons/react';

type BBox = [number, number, number, number];
import type { ContactProperty, ContactRow } from '@/lib/admin/contact-types';
import { stageLabel, stageGroup } from '@/lib/admin/lifecycle-stage';
import { NotMappedModal } from './NotMappedModal';
import styles from './ContactsMapView.module.css';
import 'mapbox-gl/dist/mapbox-gl.css';

type Props = {
  rows: ContactRow[];
};

type PinProps = {
  propertyId: string;
  contactId: string;
  contactName: string;
  companyName: string | null;
  avatarUrl: string | null;
  stageGroup: ReturnType<typeof stageGroup>;
  stageLabel: string;
  addressLine1: string;
  city: string | null;
  state: string | null;
};

type PinFeature = {
  type: 'Feature';
  properties: PinProps;
  geometry: { type: 'Point'; coordinates: [number, number] };
};

const STAGE_COLOR: Record<ReturnType<typeof stageGroup>, string> = {
  lead: '#02AAEB',
  onboarding: '#8B5CF6',
  active: '#10B981',
  cold: '#0369A1',
  dormant: '#6B7280',
};

const DEFAULT_VIEWPORT = {
  latitude: 39.5,
  longitude: -98.35,
  zoom: 3.5,
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ContactsMapView({ rows }: Props) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapRef = useRef<MapRef>(null);
  const [viewport, setViewport] = useState(DEFAULT_VIEWPORT);
  const [selected, setSelected] = useState<PinFeature | null>(null);
  const [notMappedOpen, setNotMappedOpen] = useState(false);

  const { points, notMapped } = useMemo(() => {
    const features: PinFeature[] = [];
    const unmapped: ContactRow[] = [];
    for (const row of rows) {
      const mappable = row.properties.filter(
        (p): p is ContactProperty & { latitude: number; longitude: number } =>
          p.latitude != null && p.longitude != null,
      );
      if (mappable.length === 0) {
        unmapped.push(row);
        continue;
      }
      for (const p of mappable) {
        features.push({
          type: 'Feature',
          properties: {
            propertyId: p.id,
            contactId: row.id,
            contactName: row.fullName,
            companyName: row.companyName,
            avatarUrl: row.avatarUrl,
            stageGroup: stageGroup(row.lifecycleStage),
            stageLabel: stageLabel(row.lifecycleStage),
            addressLine1: p.addressLine1,
            city: p.city,
            state: p.state,
          },
          geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
        });
      }
    }
    return { points: features, notMapped: unmapped };
  }, [rows]);

  const cluster = useMemo(() => {
    const sc = new Supercluster<PinProps>({
      radius: 60,
      maxZoom: 16,
    });
    sc.load(points);
    return sc;
  }, [points]);

  const clusters = useMemo(() => {
    const map = mapRef.current?.getMap();
    if (!map) {
      return cluster.getClusters(
        [-180, -85, 180, 85],
        Math.floor(viewport.zoom),
      );
    }
    const bounds = map.getBounds();
    if (!bounds) return [];
    const bbox: BBox = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];
    return cluster.getClusters(bbox, Math.floor(viewport.zoom));
  }, [cluster, viewport]);

  const handleClusterClick = useCallback(
    (clusterId: number, longitude: number, latitude: number) => {
      const expansionZoom = Math.min(
        cluster.getClusterExpansionZoom(clusterId),
        16,
      );
      mapRef.current?.easeTo({
        center: [longitude, latitude],
        zoom: expansionZoom,
        duration: 500,
      });
    },
    [cluster],
  );

  if (!token) {
    return (
      <div className={styles.missingToken}>
        <House size={28} weight="duotone" />
        <h3>Map is not configured</h3>
        <p>
          The <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> environment variable is not
          set. Add it via Doppler and redeploy to enable the map view.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.mapShell}>
      <Map
        ref={mapRef}
        mapboxAccessToken={token}
        mapStyle="mapbox://styles/mapbox/light-v11"
        initialViewState={DEFAULT_VIEWPORT}
        onMove={(e) =>
          setViewport({
            latitude: e.viewState.latitude,
            longitude: e.viewState.longitude,
            zoom: e.viewState.zoom,
          })
        }
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {clusters.map((c) => {
          const [longitude, latitude] = c.geometry.coordinates;
          const cp = c.properties as Supercluster.ClusterProperties &
            Partial<PinProps>;
          const isCluster = cp.cluster === true;

          if (isCluster) {
            const count = cp.point_count ?? 0;
            const size = 36 + Math.min(count, 50) * 0.9;
            return (
              <Marker
                key={`cluster-${cp.cluster_id}`}
                longitude={longitude}
                latitude={latitude}
                anchor="center"
              >
                <button
                  type="button"
                  className={styles.cluster}
                  style={{ width: size, height: size }}
                  onClick={() =>
                    handleClusterClick(
                      cp.cluster_id as number,
                      longitude,
                      latitude,
                    )
                  }
                  aria-label={`${count} properties, click to zoom in`}
                >
                  {count}
                </button>
              </Marker>
            );
          }

          const feature = c as unknown as PinFeature;
          const color = STAGE_COLOR[feature.properties.stageGroup];
          return (
            <Marker
              key={`pin-${feature.properties.propertyId}`}
              longitude={longitude}
              latitude={latitude}
              anchor="bottom"
            >
              <button
                type="button"
                className={styles.pin}
                style={{ borderColor: color, background: color }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(feature);
                }}
                aria-label={`${feature.properties.contactName} — ${feature.properties.addressLine1}`}
              >
                {feature.properties.avatarUrl ? (
                  <Image
                    src={feature.properties.avatarUrl}
                    alt=""
                    width={28}
                    height={28}
                    className={styles.pinAvatar}
                  />
                ) : (
                  <span className={styles.pinInitials}>
                    {initials(feature.properties.contactName)}
                  </span>
                )}
              </button>
            </Marker>
          );
        })}

        {selected ? (
          <Popup
            longitude={selected.geometry.coordinates[0]}
            latitude={selected.geometry.coordinates[1]}
            anchor="bottom"
            offset={18}
            closeOnClick={false}
            closeButton={false}
            onClose={() => setSelected(null)}
            className={styles.popup}
          >
            <div className={styles.popupHeader}>
              {selected.properties.avatarUrl ? (
                <Image
                  src={selected.properties.avatarUrl}
                  alt=""
                  width={40}
                  height={40}
                  className={styles.popupAvatar}
                />
              ) : (
                <div className={styles.popupAvatarFallback}>
                  {initials(selected.properties.contactName)}
                </div>
              )}
              <div className={styles.popupHeaderText}>
                <div className={styles.popupName}>
                  {selected.properties.contactName}
                </div>
                {selected.properties.companyName ? (
                  <div className={styles.popupCompany}>
                    {selected.properties.companyName}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                className={styles.popupClose}
                onClick={() => setSelected(null)}
                aria-label="Close"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
            <div
              className={styles.popupStagePill}
              style={{
                background: `${STAGE_COLOR[selected.properties.stageGroup]}1f`,
                color: STAGE_COLOR[selected.properties.stageGroup],
              }}
            >
              {selected.properties.stageLabel}
            </div>
            <div className={styles.popupAddress}>
              {selected.properties.addressLine1}
              {selected.properties.city || selected.properties.state ? (
                <div className={styles.popupAddressSub}>
                  {[selected.properties.city, selected.properties.state]
                    .filter(Boolean)
                    .join(', ')}
                </div>
              ) : null}
            </div>
            <Link
              href={`/admin/contacts/${selected.properties.contactId}`}
              className={styles.popupCta}
            >
              View contact
            </Link>
          </Popup>
        ) : null}
      </Map>

      {notMapped.length > 0 ? (
        <button
          type="button"
          className={styles.notMappedChip}
          onClick={() => setNotMappedOpen(true)}
        >
          <ListBullets size={14} weight="duotone" />
          {notMapped.length}{' '}
          {notMapped.length === 1 ? 'contact' : 'contacts'} not mapped
        </button>
      ) : null}

      {notMappedOpen ? (
        <NotMappedModal
          rows={notMapped}
          onClose={() => setNotMappedOpen(false)}
        />
      ) : null}
    </div>
  );
}
