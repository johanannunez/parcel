'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import MapboxMap, {
  Marker,
  NavigationControl,
  Popup,
  type MapRef,
} from 'react-map-gl/mapbox';
import Supercluster from 'supercluster';
import { House } from '@phosphor-icons/react';
import { STAGE_COLOR, initials, stageGroup } from '@/lib/admin/lifecycle-stage';
import type { OwnerMapPin, PropertyMapPin, UnmappedOwner } from './page';
import { LayerToggleBar, type LayerKey, type LayerState } from './LayerToggleBar';
import { MapPopover } from './MapPopover';
import { NotMappedChip, type NotMappedItem } from './NotMappedChip';
import styles from './AdminMapView.module.css';
import 'mapbox-gl/dist/mapbox-gl.css';

type BBox = [number, number, number, number];

type OwnerFeature = {
  type: 'Feature';
  properties: OwnerMapPin;
  geometry: { type: 'Point'; coordinates: [number, number] };
};

type PropertyFeature = {
  type: 'Feature';
  properties: PropertyMapPin;
  geometry: { type: 'Point'; coordinates: [number, number] };
};

type SelectedPin =
  | { kind: 'owner'; feature: OwnerFeature }
  | { kind: 'property'; feature: PropertyFeature };

const DEFAULT_VIEWPORT = { latitude: 39.5, longitude: -98.35, zoom: 3.5 };

type Props = {
  owners: OwnerMapPin[];
  properties: PropertyMapPin[];
  unmappedOwners: UnmappedOwner[];
};

export function AdminMapView({ owners, properties, unmappedOwners }: Props) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapRef = useRef<MapRef>(null);

  const [layers, setLayers] = useState<LayerState>({
    owners: true,
    properties: true,
    projects: false,
    tasks: false,
  });

  const [viewport, setViewport] = useState(DEFAULT_VIEWPORT);
  const [selected, setSelected] = useState<SelectedPin | null>(null);
  const [driveTimes, setDriveTimes] = useState<Map<string, string>>(new Map());

  const ownerFeatures = useMemo<OwnerFeature[]>(
    () =>
      owners.map((o) => ({
        type: 'Feature',
        properties: o,
        geometry: { type: 'Point', coordinates: [o.homeLng, o.homeLat] },
      })),
    [owners],
  );

  const propertyFeatures = useMemo<PropertyFeature[]>(
    () =>
      properties.map((p) => ({
        type: 'Feature',
        properties: p,
        geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
      })),
    [properties],
  );

  const ownerCluster = useMemo(() => {
    const sc = new Supercluster<OwnerMapPin>({ radius: 60, maxZoom: 16 });
    sc.load(ownerFeatures);
    return sc;
  }, [ownerFeatures]);

  const propertyCluster = useMemo(() => {
    const sc = new Supercluster<PropertyMapPin>({ radius: 60, maxZoom: 16 });
    sc.load(propertyFeatures);
    return sc;
  }, [propertyFeatures]);

  const getBBox = useCallback((): BBox => {
    const map = mapRef.current?.getMap();
    if (!map) return [-180, -85, 180, 85];
    const b = map.getBounds();
    if (!b) return [-180, -85, 180, 85];
    return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
  }, []);

  const zoom = Math.floor(viewport.zoom);

  const visibleOwnerClusters = useMemo(
    () => (layers.owners ? ownerCluster.getClusters(getBBox(), zoom) : []),
    [layers.owners, ownerCluster, getBBox, zoom],
  );

  const visiblePropertyClusters = useMemo(
    () => (layers.properties ? propertyCluster.getClusters(getBBox(), zoom) : []),
    [layers.properties, propertyCluster, getBBox, zoom],
  );

  const handleToggle = useCallback((key: LayerKey) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleOwnerClick = useCallback(
    async (feature: OwnerFeature) => {
      setSelected({ kind: 'owner', feature });
      if (!token) return;
      const ownerProps = feature.properties;
      const ownerProperties = properties.filter(
        (p) => p.primaryOwnerId === ownerProps.contactId,
      );
      for (const prop of ownerProperties) {
        const cacheKey = `${ownerProps.contactId}:${prop.propertyId}`;
        if (driveTimes.has(cacheKey)) continue;
        try {
          const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${ownerProps.homeLng},${ownerProps.homeLat};${prop.longitude},${prop.latitude}?access_token=${token}&overview=false`;
          const res = await fetch(url);
          const json = await res.json() as { routes?: Array<{ duration?: number }> };
          const seconds = json.routes?.[0]?.duration;
          if (seconds != null) {
            const mins = Math.round(seconds / 60);
            setDriveTimes((prev) => new Map(prev).set(cacheKey, `~${mins} min`));
          }
        } catch {
          // Drive time is best-effort.
        }
      }
    },
    [token, properties, driveTimes],
  );

  const handlePropertyClick = useCallback((feature: PropertyFeature) => {
    setSelected({ kind: 'property', feature });
  }, []);

  const handleClusterClick = useCallback(
    (sc: Supercluster, clusterId: number, longitude: number, latitude: number) => {
      const expansionZoom = Math.min(sc.getClusterExpansionZoom(clusterId), 16);
      mapRef.current?.easeTo({ center: [longitude, latitude], zoom: expansionZoom, duration: 500 });
    },
    [],
  );

  const dashedLines = useMemo(() => {
    if (!selected || selected.kind !== 'owner') return [];
    const ownerId = selected.feature.properties.contactId;
    return properties
      .filter((p) => p.primaryOwnerId === ownerId)
      .map((p) => ({
        propId: p.propertyId,
        ownerLng: selected.feature.geometry.coordinates[0],
        ownerLat: selected.feature.geometry.coordinates[1],
        propLng: p.longitude,
        propLat: p.latitude,
        driveTime: driveTimes.get(`${ownerId}:${p.propertyId}`) ?? null,
      }));
  }, [selected, properties, driveTimes]);

  const projectPoint = useCallback(
    (lng: number, lat: number): { x: number; y: number } | null => {
      const map = mapRef.current?.getMap();
      if (!map) return null;
      const p = map.project([lng, lat]);
      return { x: p.x, y: p.y };
    },
    [],
  );

  const notMappedItems = useMemo<NotMappedItem[]>(() => {
    if (!layers.owners) return [];
    return unmappedOwners.map((o) => ({
      id: o.contactId,
      fullName: o.fullName,
      companyName: o.companyName,
      avatarUrl: o.avatarUrl,
      lifecycleStage: o.lifecycleStage,
      kind: 'owner' as const,
      href: `/admin/people/${o.contactId}`,
    }));
  }, [layers.owners, unmappedOwners]);

  if (!token) {
    return (
      <div className={styles.missingToken}>
        <House size={28} weight="duotone" />
        <h3>Map is not configured</h3>
        <p>
          The <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> environment variable is not set. Add it via
          Doppler and redeploy to enable the map view.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <MapboxMap
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
        onClick={() => setSelected(null)}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {visibleOwnerClusters.map((c) => {
          const [lng, lat] = c.geometry.coordinates;
          const cp = c.properties as Supercluster.ClusterProperties & Partial<OwnerMapPin>;
          if (cp.cluster) {
            const count = cp.point_count ?? 0;
            const size = 36 + Math.min(count, 50) * 0.9;
            return (
              <Marker key={`oc-${cp.cluster_id}`} longitude={lng} latitude={lat} anchor="center">
                <button
                  type="button"
                  className={styles.cluster}
                  style={{ width: size, height: size, background: '#10B981' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClusterClick(ownerCluster, cp.cluster_id as number, lng, lat);
                  }}
                  aria-label={`${count} owners`}
                >
                  {count}
                </button>
              </Marker>
            );
          }
          const feature = c as unknown as OwnerFeature;
          const color = STAGE_COLOR[stageGroup(feature.properties.lifecycleStage)];
          const isSelected =
            selected?.kind === 'owner' &&
            selected.feature.properties.contactId === feature.properties.contactId;
          return (
            <Marker
              key={`owner-${feature.properties.contactId}`}
              longitude={lng}
              latitude={lat}
              anchor="center"
            >
              <button
                type="button"
                className={`${styles.ownerPin} ${isSelected ? styles.ownerPinSelected : ''}`}
                style={{ background: color }}
                onClick={(e) => {
                  e.stopPropagation();
                  void handleOwnerClick(feature);
                }}
                aria-label={feature.properties.fullName}
              >
                {feature.properties.avatarUrl ? (
                  <Image
                    src={feature.properties.avatarUrl}
                    alt=""
                    width={36}
                    height={36}
                    className={styles.ownerPinImg}
                  />
                ) : (
                  initials(feature.properties.fullName)
                )}
              </button>
            </Marker>
          );
        })}

        {visiblePropertyClusters.map((c) => {
          const [lng, lat] = c.geometry.coordinates;
          const cp = c.properties as Supercluster.ClusterProperties & Partial<PropertyMapPin>;
          if (cp.cluster) {
            const count = cp.point_count ?? 0;
            const size = 32 + Math.min(count, 50) * 0.8;
            return (
              <Marker key={`pc-${cp.cluster_id}`} longitude={lng} latitude={lat} anchor="center">
                <button
                  type="button"
                  className={styles.cluster}
                  style={{ width: size, height: size, background: '#02AAEB' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClusterClick(propertyCluster, cp.cluster_id as number, lng, lat);
                  }}
                  aria-label={`${count} properties`}
                >
                  {count}
                </button>
              </Marker>
            );
          }
          const feature = c as unknown as PropertyFeature;
          const color = STAGE_COLOR[stageGroup(feature.properties.ownerLifecycleStage)];
          const isSelected =
            selected?.kind === 'property' &&
            selected.feature.properties.propertyId === feature.properties.propertyId;
          return (
            <Marker
              key={`prop-${feature.properties.propertyId}`}
              longitude={lng}
              latitude={lat}
              anchor="center"
            >
              <button
                type="button"
                className={`${styles.propertyPin} ${isSelected ? styles.propertyPinSelected : ''}`}
                style={{ background: color }}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePropertyClick(feature);
                }}
                aria-label={feature.properties.addressLine1}
              >
                <House size={14} weight="duotone" color="white" />
              </button>
            </Marker>
          );
        })}

        {selected?.kind === 'owner' ? (
          <Popup
            longitude={selected.feature.geometry.coordinates[0]}
            latitude={selected.feature.geometry.coordinates[1]}
            anchor="bottom"
            offset={22}
            closeOnClick={false}
            closeButton={false}
            onClose={() => setSelected(null)}
            className="global-map-popup"
          >
            <MapPopover
              kind="owner"
              name={selected.feature.properties.fullName}
              sub={selected.feature.properties.companyName}
              avatarUrl={selected.feature.properties.avatarUrl}
              avatarColor={STAGE_COLOR[stageGroup(selected.feature.properties.lifecycleStage)]}
              lifecycleStage={selected.feature.properties.lifecycleStage}
              meta={(() => {
                const count = properties.filter(
                  (p) => p.primaryOwnerId === selected.feature.properties.contactId,
                ).length;
                return count > 0 ? `${count} ${count === 1 ? 'property' : 'properties'}` : null;
              })()}
              ctaLabel="View contact"
              ctaHref={`/admin/people/${selected.feature.properties.contactId}`}
              onClose={() => setSelected(null)}
            />
          </Popup>
        ) : null}

        {selected?.kind === 'property' ? (
          <Popup
            longitude={selected.feature.geometry.coordinates[0]}
            latitude={selected.feature.geometry.coordinates[1]}
            anchor="bottom"
            offset={18}
            closeOnClick={false}
            closeButton={false}
            onClose={() => setSelected(null)}
            className="global-map-popup"
          >
            <MapPopover
              kind="property"
              name={selected.feature.properties.addressLine1}
              sub={selected.feature.properties.ownerName}
              avatarUrl={null}
              avatarColor={STAGE_COLOR[stageGroup(selected.feature.properties.ownerLifecycleStage)]}
              lifecycleStage={selected.feature.properties.ownerLifecycleStage}
              address={selected.feature.properties.addressLine1}
              addressSub={
                [selected.feature.properties.city, selected.feature.properties.state]
                  .filter(Boolean)
                  .join(', ') || null
              }
              ctaLabel="View property"
              ctaHref={`/admin/properties/${selected.feature.properties.propertyId}`}
              onClose={() => setSelected(null)}
            />
          </Popup>
        ) : null}
      </MapboxMap>

      {dashedLines.length > 0 ? (
        <svg className={styles.linesOverlay} style={{ width: '100%', height: '100%' }}>
          {dashedLines.map((line) => {
            const from = projectPoint(line.ownerLng, line.ownerLat);
            const to = projectPoint(line.propLng, line.propLat);
            if (!from || !to) return null;
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            return (
              <g key={line.propId}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#10B981"
                  strokeWidth={1.5}
                  strokeDasharray="6,4"
                  opacity={0.7}
                />
                {line.driveTime ? (
                  <text
                    x={midX}
                    y={midY - 6}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#10B981"
                    fontWeight={600}
                    style={{ fontFamily: 'inherit' }}
                  >
                    {line.driveTime}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      ) : null}

      <LayerToggleBar layers={layers} onToggle={handleToggle} />
      <NotMappedChip items={notMappedItems} />
    </div>
  );
}
