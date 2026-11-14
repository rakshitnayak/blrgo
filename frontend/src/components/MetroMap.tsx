import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl";
import mapLibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import type { FeatureCollection, LineString, Point } from "geojson";
import type { Network, Route } from "../types";
import "maplibre-gl/dist/maplibre-gl.css";

maplibregl.setWorkerUrl(mapLibreWorkerUrl);

type Props = { network: Network; route: Route | null };

function lineFeatures(network: Network): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: network.lines.map((line) => ({
      type: "Feature",
      properties: { id: line.id, name: line.name, color: line.color },
      geometry: { type: "LineString", coordinates: line.geometry },
    })),
  };
}

function stationFeatures(network: Network): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: network.stations.map((station) => ({
      type: "Feature",
      properties: {
        id: station.id,
        name: station.name,
        lines: station.lines.join(","),
        color: network.lines.find((line) => line.id === station.lines[0])?.color ?? "#163228",
        interchange: station.lines.length > 1,
      },
      geometry: { type: "Point", coordinates: [station.longitude, station.latitude] },
    })),
  };
}

function routeFeatures(route: Route | null): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: route?.segments.map((segment) => ({
      type: "Feature",
      properties: { color: segment.color, line: segment.lineName },
      geometry: {
        type: "LineString",
        coordinates: segment.stops.map((stop) => [stop.longitude, stop.latitude]),
      },
    })) ?? [],
  };
}

export function MetroMap({ network, route }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    if (!container.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: container.current,
      center: [77.5946, 12.9716],
      zoom: 10.35,
      minZoom: 9,
      maxZoom: 17,
      attributionControl: {},
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm", paint: { "raster-saturation": -0.85, "raster-opacity": 0.72 } }],
      },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }), "top-right");

    map.on("load", () => {
      map.addSource("metro-lines", { type: "geojson", data: lineFeatures(network) });
      map.addLayer({ id: "metro-casing", type: "line", source: "metro-lines", paint: { "line-color": "#ffffff", "line-width": 8, "line-opacity": 0.92 } });
      map.addLayer({ id: "metro-lines", type: "line", source: "metro-lines", paint: { "line-color": ["get", "color"], "line-width": 4.5, "line-opacity": 0.88 } });
      map.addSource("route", { type: "geojson", data: routeFeatures(route) });
      map.addLayer({ id: "route-casing", type: "line", source: "route", paint: { "line-color": "#10271d", "line-width": 11, "line-opacity": 0.9 } });
      map.addLayer({ id: "route-line", type: "line", source: "route", paint: { "line-color": ["get", "color"], "line-width": 7 } });
      map.addSource("stations", { type: "geojson", data: stationFeatures(network) });
      map.addLayer({
        id: "stations",
        type: "circle",
        source: "stations",
        paint: {
          "circle-radius": ["case", ["get", "interchange"], 6.5, 4.5],
          "circle-color": "#fffdf8",
          "circle-stroke-color": ["get", "color"],
          "circle-stroke-width": ["case", ["get", "interchange"], 3.5, 2.5],
        },
      });
      map.on("mouseenter", "stations", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "stations", () => { map.getCanvas().style.cursor = ""; });
      map.on("click", "stations", (event: MapLayerMouseEvent) => {
        const feature = event.features?.[0];
        if (!feature || feature.geometry.type !== "Point") return;
        new maplibregl.Popup({ offset: 10, closeButton: false })
          .setLngLat(feature.geometry.coordinates as [number, number])
          .setText(String(feature.properties?.name ?? "Metro station"))
          .addTo(map);
      });
    });

    return () => { map.remove(); mapRef.current = null; };
  }, [network]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => {
      const source = map.getSource("route") as GeoJSONSource | undefined;
      source?.setData(routeFeatures(route));
      if (!route) return;
      const bounds = new maplibregl.LngLatBounds();
      route.stops.forEach((station) => bounds.extend([station.longitude, station.latitude]));
      map.fitBounds(bounds, { padding: { top: 90, right: 70, bottom: 90, left: 70 }, maxZoom: 13, duration: 900 });
    };
    if (map.loaded()) update(); else map.once("load", update);
  }, [route]);

  return <div className="metro-map" ref={container} aria-label="Interactive map showing all operational Namma Metro stations" />;
}
