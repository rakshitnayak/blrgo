import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl";
import mapLibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import type { FeatureCollection, LineString, Point } from "geojson";
import { futureNetwork, type FutureLineProperties } from "../data/futureNetwork";
import type { Network, PlatformInfo, Route, Station, UserLocation } from "../types";
import "maplibre-gl/dist/maplibre-gl.css";

maplibregl.setWorkerUrl(mapLibreWorkerUrl);

type Props = { network: Network; route: Route | null; userLocation: UserLocation | null; nearestStation: Station | null };
type StationView = "all" | "journey";

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

function stationFeatures(network: Network, route: Route | null, view: StationView, nearestStation: Station | null): FeatureCollection<Point> {
  const routeIds = new Set(route?.stops.map((station) => station.id) ?? []);
  const stations = view === "journey" && route
    ? network.stations.filter((station) => routeIds.has(station.id))
    : network.stations;
  return {
    type: "FeatureCollection",
    features: stations.map((station) => ({
      type: "Feature",
      properties: {
        id: station.id,
        name: station.name,
        color: network.lines.find((line) => line.id === station.lines[0])?.color ?? "#163228",
        interchange: station.lines.length > 1,
        onRoute: routeIds.has(station.id),
        nearest: station.id === nearestStation?.id,
      },
      geometry: { type: "Point", coordinates: [station.longitude, station.latitude] },
    })),
  };
}

function userLocationFeatures(location: UserLocation | null): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: location ? [{
      type: "Feature",
      properties: { accuracy: location.accuracy },
      geometry: { type: "Point", coordinates: [location.longitude, location.latitude] },
    }] : [],
  };
}

function nearestLinkFeatures(location: UserLocation | null, station: Station | null): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: location && station ? [{
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [[location.longitude, location.latitude], [station.longitude, station.latitude]],
      },
    }] : [],
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

function junctionIcon(): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = 72;
  canvas.height = 72;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");
  context.fillStyle = "#153c2f";
  context.beginPath();
  context.arc(36, 36, 31, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#f3b642";
  context.lineWidth = 5;
  context.stroke();
  context.fillStyle = "#fffdf8";
  context.beginPath();
  context.arc(36, 36, 23, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#153c2f";
  context.beginPath();
  context.roundRect(23, 19, 26, 31, 7);
  context.fill();
  context.fillStyle = "#d9f3e7";
  context.fillRect(28, 25, 16, 9);
  context.fillStyle = "#f3b642";
  context.beginPath();
  context.arc(29, 42, 2.3, 0, Math.PI * 2);
  context.arc(43, 42, 2.3, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#153c2f";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(27, 55);
  context.lineTo(32, 49);
  context.moveTo(45, 55);
  context.lineTo(40, 49);
  context.stroke();
  return context.getImageData(0, 0, 72, 72);
}

function endpointDirections(platform: PlatformInfo, network: Network): string[] {
  const line = network.lines.find((candidate) => candidate.id === platform.line);
  if (!line) return platform.towards;
  const terminalNames = [line.stationIds[0], line.stationIds.at(-1)]
    .map((id) => network.stations.find((station) => station.id === id)?.name)
    .filter((name): name is string => Boolean(name));
  const terminalDirections = platform.towards.filter((direction) => terminalNames.includes(direction));
  return terminalDirections.length ? terminalDirections : platform.towards.slice(0, 2);
}

function stationPopup(station: Station, network: Network): HTMLElement {
  const platforms = station.platforms ?? [];
  const content = document.createElement("div");
  content.className = "station-popup";

  const eyebrow = document.createElement("span");
  eyebrow.className = "station-popup__eyebrow";
  eyebrow.textContent = station.lines.length > 1 ? "Metro interchange" : "Metro station";
  content.appendChild(eyebrow);

  const title = document.createElement("strong");
  title.textContent = station.name;
  content.appendChild(title);

  const lines = document.createElement("div");
  lines.className = "station-popup__lines";
  station.lines.forEach((lineId) => {
    const line = network.lines.find((candidate) => candidate.id === lineId);
    const pill = document.createElement("span");
    pill.style.setProperty("--pill-color", line?.color ?? "#153c2f");
    pill.textContent = line?.name ?? lineId;
    lines.appendChild(pill);
  });
  content.appendChild(lines);

  const platformTitle = document.createElement("small");
  platformTitle.textContent = platforms.length ? "Platform guide" : "Platform information";
  content.appendChild(platformTitle);

  if (platforms.length) {
    const guide = document.createElement("div");
    guide.className = "station-popup__platforms";
    platforms.forEach((platform) => {
      const row = document.createElement("div");
      const code = document.createElement("b");
      code.textContent = platform.code;
      const copy = document.createElement("span");
      const lineName = network.lines.find((line) => line.id === platform.line)?.name ?? platform.line;
      const direction = document.createElement("strong");
      direction.textContent = `Platform ${platform.code} · ${lineName}`;
      const towards = document.createElement("small");
      towards.textContent = `Towards ${endpointDirections(platform, network).join(" / ")}`;
      copy.append(direction, towards);
      row.append(code, copy);
      guide.appendChild(row);
    });
    content.appendChild(guide);
  } else {
    const unavailable = document.createElement("p");
    unavailable.textContent = "Not yet available in the verified feed. Follow live station displays.";
    content.appendChild(unavailable);
  }

  const note = document.createElement("em");
  note.textContent = station.accessible ? "Step-free access listed" : "Confirm accessibility at the station";
  content.appendChild(note);
  return content;
}

function futureLinePopup(line: FutureLineProperties): HTMLElement {
  const content = document.createElement("div");
  content.className = "future-popup";

  const eyebrow = document.createElement("span");
  eyebrow.textContent = "Future corridor · not operational";
  const title = document.createElement("strong");
  title.textContent = line.name;
  const route = document.createElement("p");
  route.textContent = line.route;
  const status = document.createElement("small");
  status.textContent = line.status;
  content.append(eyebrow, title, route, status);
  return content;
}

export function MetroMap({ network, route, userLocation, nearestStation }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [showNames, setShowNames] = useState(false);
  const [showFutureLines, setShowFutureLines] = useState(true);
  const [stationView, setStationView] = useState<StationView>("all");
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const [mapAttempt, setMapAttempt] = useState(0);

  useEffect(() => {
    setStationView(route ? "journey" : "all");
  }, [route]);

  useEffect(() => {
    if (!container.current || mapRef.current) return;
    let map: MapLibreMap;
    let removed = false;
    setMapUnavailable(false);

    try {
      map = new maplibregl.Map({
        container: container.current,
        center: [77.5946, 12.9716],
        zoom: 10.35,
        minZoom: 9,
        maxZoom: 17,
        attributionControl: {},
        style: {
          version: 8,
          glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
            },
          },
          layers: [{ id: "osm", type: "raster", source: "osm", paint: { "raster-saturation": -0.88, "raster-opacity": 0.7 } }],
        },
      });
    } catch (error) {
      if (error instanceof maplibregl.GPUInitializationError) {
        container.current.replaceChildren();
        setMapUnavailable(true);
        return;
      }
      throw error;
    }

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("error", (event) => {
      if (event.error instanceof maplibregl.GPUInitializationError) {
        setMapUnavailable(true);
        if (!removed) {
          removed = true;
          map.remove();
          mapRef.current = null;
        }
        return;
      }
      console.error(event.error);
    });

    map.on("load", () => {
      map.addImage("junction-icon", junctionIcon(), { pixelRatio: 2 });
      map.addSource("future-lines", { type: "geojson", data: futureNetwork });
      map.addLayer({ id: "future-lines-casing", type: "line", source: "future-lines", paint: { "line-color": "#fffdf8", "line-width": 7, "line-opacity": 0.84 } });
      map.addLayer({ id: "future-lines", type: "line", source: "future-lines", paint: { "line-color": ["get", "color"], "line-width": 3.4, "line-dasharray": [2, 2], "line-opacity": 0.72 } });
      map.addLayer({ id: "future-lines-hit", type: "line", source: "future-lines", paint: { "line-color": "#000000", "line-width": 18, "line-opacity": 0.01 } });
      map.addSource("metro-lines", { type: "geojson", data: lineFeatures(network) });
      map.addLayer({ id: "metro-casing", type: "line", source: "metro-lines", paint: { "line-color": "#ffffff", "line-width": 8, "line-opacity": 0.92 } });
      map.addLayer({ id: "metro-lines", type: "line", source: "metro-lines", paint: { "line-color": ["get", "color"], "line-width": 4.5, "line-opacity": 0.88 } });
      map.addSource("route", { type: "geojson", data: routeFeatures(route) });
      map.addLayer({ id: "route-casing", type: "line", source: "route", paint: { "line-color": "#10271d", "line-width": 12, "line-opacity": 0.9 } });
      map.addLayer({ id: "route-line", type: "line", source: "route", paint: { "line-color": ["get", "color"], "line-width": 7 } });
      map.addSource("nearest-link", { type: "geojson", data: nearestLinkFeatures(userLocation, nearestStation) });
      map.addLayer({ id: "nearest-link", type: "line", source: "nearest-link", paint: { "line-color": "#1678d3", "line-width": 2.5, "line-dasharray": [2, 2], "line-opacity": 0.8 } });
      map.addSource("stations", { type: "geojson", data: stationFeatures(network, route, "all", nearestStation) });
      map.addLayer({
        id: "nearest-station-halo",
        type: "circle",
        source: "stations",
        filter: ["==", ["get", "nearest"], true],
        paint: { "circle-radius": 16, "circle-color": "#f5b83b", "circle-opacity": 0.24, "circle-stroke-color": "#d88e12", "circle-stroke-width": 2 },
      });
      map.addLayer({
        id: "route-station-halo",
        type: "circle",
        source: "stations",
        filter: ["==", ["get", "onRoute"], true],
        paint: { "circle-radius": 11, "circle-color": "#fffdf8", "circle-stroke-color": "#153c2f", "circle-stroke-width": 2.5, "circle-opacity": 0.95 },
      });
      map.addLayer({
        id: "station-shells",
        type: "circle",
        source: "stations",
        paint: {
          "circle-radius": ["case", ["get", "interchange"], 7.5, 5],
          "circle-color": "#fffdf8",
          "circle-stroke-color": ["get", "color"],
          "circle-stroke-width": ["case", ["get", "interchange"], 4, 2.5],
        },
      });
      map.addLayer({
        id: "station-cores",
        type: "circle",
        source: "stations",
        filter: ["==", ["get", "interchange"], false],
        paint: { "circle-radius": 2.15, "circle-color": ["get", "color"] },
      });
      map.addLayer({
        id: "junction-icons",
        type: "symbol",
        source: "stations",
        filter: ["==", ["get", "interchange"], true],
        layout: { "icon-image": "junction-icon", "icon-size": 0.62, "icon-allow-overlap": true, "icon-ignore-placement": true },
      });
      map.addLayer({
        id: "station-labels",
        type: "symbol",
        source: "stations",
        layout: {
          "visibility": "none",
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Semibold"],
          "text-size": ["case", ["get", "interchange"], 12, 10],
          "text-variable-anchor": ["top", "bottom", "left", "right"],
          "text-radial-offset": ["case", ["get", "interchange"], 2.2, 1.2],
          "text-justify": "auto",
          "text-padding": 2,
          "text-optional": true,
          "symbol-sort-key": ["case", ["get", "interchange"], 0, 1],
        },
        paint: {
          "text-color": ["case", ["get", "interchange"], "#102d22", "#30443a"],
          "text-halo-color": "#fffdf8",
          "text-halo-width": 2,
          "text-halo-blur": 0.3,
        },
      });
      map.addSource("user-location", { type: "geojson", data: userLocationFeatures(userLocation) });
      map.addLayer({ id: "user-location-glow", type: "circle", source: "user-location", paint: { "circle-radius": 16, "circle-color": "#1678d3", "circle-opacity": 0.18 } });
      map.addLayer({ id: "user-location-dot", type: "circle", source: "user-location", paint: { "circle-radius": 6.5, "circle-color": "#1678d3", "circle-stroke-color": "#ffffff", "circle-stroke-width": 3 } });
      map.addLayer({
        id: "user-location-label",
        type: "symbol",
        source: "user-location",
        layout: { "text-field": "You are here", "text-font": ["Open Sans Semibold"], "text-size": 10, "text-offset": [0, 1.9], "text-allow-overlap": true },
        paint: { "text-color": "#155a9c", "text-halo-color": "#fffdf8", "text-halo-width": 2 },
      });
      map.on("mouseenter", "station-shells", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "station-shells", () => { map.getCanvas().style.cursor = ""; });
      map.on("mouseenter", "future-lines-hit", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "future-lines-hit", () => { map.getCanvas().style.cursor = ""; });
      map.on("click", "future-lines-hit", (event: MapLayerMouseEvent) => {
        const properties = event.features?.[0]?.properties as FutureLineProperties | undefined;
        if (!properties) return;
        new maplibregl.Popup({ offset: 10, closeButton: true, maxWidth: "310px" })
          .setLngLat(event.lngLat)
          .setDOMContent(futureLinePopup(properties))
          .addTo(map);
      });
      map.on("click", "station-shells", (event: MapLayerMouseEvent) => {
        const feature = event.features?.[0];
        if (!feature || feature.geometry.type !== "Point") return;
        const station = network.stations.find((candidate) => candidate.id === feature.properties?.id);
        if (!station) return;
        new maplibregl.Popup({ offset: 18, closeButton: true, maxWidth: "330px" })
          .setLngLat(feature.geometry.coordinates as [number, number])
          .setDOMContent(stationPopup(station, network))
          .addTo(map);
      });
    });

    return () => {
      if (!removed) map.remove();
      mapRef.current = null;
    };
  }, [mapAttempt, network]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => {
      const routeSource = map.getSource("route") as GeoJSONSource | undefined;
      routeSource?.setData(routeFeatures(route));
      const stationSource = map.getSource("stations") as GeoJSONSource | undefined;
      stationSource?.setData(stationFeatures(network, route, stationView, nearestStation));
      const locationSource = map.getSource("user-location") as GeoJSONSource | undefined;
      locationSource?.setData(userLocationFeatures(userLocation));
      const nearestLinkSource = map.getSource("nearest-link") as GeoJSONSource | undefined;
      nearestLinkSource?.setData(nearestLinkFeatures(userLocation, nearestStation));
      const bounds = new maplibregl.LngLatBounds();
      if (stationView === "journey" && route) {
        route.stops.forEach((station) => bounds.extend([station.longitude, station.latitude]));
      } else if (userLocation && nearestStation) {
        bounds.extend([userLocation.longitude, userLocation.latitude]);
        bounds.extend([nearestStation.longitude, nearestStation.latitude]);
      } else if (showFutureLines) {
        network.stations.forEach((station) => bounds.extend([station.longitude, station.latitude]));
        futureNetwork.features.forEach((line) => line.geometry.coordinates.forEach((coordinate) => bounds.extend(coordinate as [number, number])));
      } else {
        network.stations.forEach((station) => bounds.extend([station.longitude, station.latitude]));
      }
      map.fitBounds(bounds, {
        padding: { top: 110, right: 80, bottom: 100, left: 80 },
        maxZoom: stationView === "journey" ? 13 : userLocation && nearestStation ? 14 : showFutureLines ? 9.65 : 10.5,
        duration: 900,
      });
    };
    if (map.loaded()) update(); else map.once("load", update);
  }, [network, nearestStation, route, showFutureLines, stationView, userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const updateVisibility = () => map.setLayoutProperty("station-labels", "visibility", showNames ? "visible" : "none");
    if (map.getLayer("station-labels")) updateVisibility(); else map.once("load", updateVisibility);
  }, [showNames]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const updateVisibility = () => {
      const visibility = showFutureLines && stationView === "all" ? "visible" : "none";
      const futureSource = map.getSource("future-lines") as GeoJSONSource | undefined;
      futureSource?.setData(visibility === "visible" ? futureNetwork : { type: "FeatureCollection", features: [] });
      if (map.getLayer("future-lines-casing")) map.setLayoutProperty("future-lines-casing", "visibility", visibility);
      if (map.getLayer("future-lines")) map.setLayoutProperty("future-lines", "visibility", visibility);
      if (map.getLayer("future-lines-hit")) map.setLayoutProperty("future-lines-hit", "visibility", visibility);
    };
    if (map.getSource("future-lines")) updateVisibility(); else map.once("load", updateVisibility);
  }, [showFutureLines, stationView]);

  return (
    <div className="metro-map-shell">
      <div className="metro-map" ref={container} aria-label="Interactive map showing operational and future Namma Metro lines" />
      {mapUnavailable ? (
        <div className="map-fallback" role="status">
          <div className="map-fallback__graphic" aria-hidden="true">
            <span /><span /><span />
          </div>
          <p className="section-label">Interactive map unavailable</p>
          <h3>Your journey planner still works</h3>
          <p>This browser or device could not start the map. You can still choose stations, find the nearest stop and view complete route details.</p>
          <small>Updating your browser or enabling hardware acceleration may restore the map.</small>
          <button type="button" onClick={() => setMapAttempt((attempt) => attempt + 1)}>Try map again</button>
        </div>
      ) : (
        <>
          <div className="map-toolbar" aria-label="Map display controls">
            <div className="map-view-toggle" aria-label="Station view">
              <button className={stationView === "all" ? "active" : ""} type="button" onClick={() => setStationView("all")}>Network</button>
              <button className={stationView === "journey" ? "active" : ""} type="button" disabled={!route} onClick={() => setStationView("journey")}>My route</button>
            </div>
            <button className={`name-toggle ${showNames ? "active" : ""}`} type="button" role="switch" aria-label="Show station names" aria-checked={showNames} onClick={() => setShowNames((visible) => !visible)}>
              <span>Station names</span><i />
            </button>
            <button className={`name-toggle future-toggle ${showFutureLines ? "active" : ""}`} type="button" role="switch" aria-label="Show future metro lines" aria-checked={showFutureLines} onClick={() => setShowFutureLines((visible) => !visible)}>
              <span>Future lines</span><i />
            </button>
          </div>
          <div className="map-key"><span className="map-key__junction">●</span><b>Junction</b><span className="map-key__station">●</span><b>Station</b>{showFutureLines && stationView === "all" && <><span className="map-key__future"/><b>Future</b></>}</div>
        </>
      )}
    </div>
  );
}
