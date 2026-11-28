import { useEffect, useMemo, useState } from "react";
import { MetroMap } from "./components/MetroMap";
import { StationPicker } from "./components/StationPicker";
import type { Network, Route, UserLocation } from "./types";

function TrainIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="15" rx="4"/><path d="M8 21l2-3m6 3-2-3M8 8h8M8 13h.01M16 13h.01"/></svg>;
}

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>;
}

function LocationIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"/><circle cx="12" cy="10" r="2.2"/></svg>;
}

function ResetIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h11a5 5 0 0 1 0 10H8m-4-6V7m0 0 3-3"/></svg>;
}

function distanceInKilometers(from: UserLocation, to: { latitude: number; longitude: number }) {
  const earthRadius = 6371;
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const startLatitude = radians(from.latitude);
  const endLatitude = radians(to.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function formatDistance(kilometers: number) {
  return kilometers < 1 ? `${Math.round(kilometers * 1000)} m` : `${kilometers.toFixed(1)} km`;
}

export default function App() {
  const [network, setNetwork] = useState<Network | null>(null);
  const [origin, setOrigin] = useState("KGWA");
  const [destination, setDestination] = useState("WHTM");
  const [route, setRoute] = useState<Route | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [showAllStops, setShowAllStops] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [findingLocation, setFindingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [nearestStationId, setNearestStationId] = useState("");
  const [nearestDistance, setNearestDistance] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/network")
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then(setNetwork)
      .catch(() => setError("We couldn't reach the journey service. Start the Spring Boot API and refresh."));
  }, []);

  async function planJourney() {
    if (!origin || !destination || origin === destination) return;
    setError("");
    setLoadingRoute(true);
    setShowAllStops(false);
    try {
      const response = await fetch(`/api/routes?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}`);
      if (!response.ok) throw new Error();
      setRoute(await response.json());
    } catch {
      setError("That route could not be calculated. Please try another pair of stations.");
    } finally {
      setLoadingRoute(false);
    }
  }

  function swapStations() {
    setOrigin(destination);
    setDestination(origin);
    setRoute(null);
  }

  function findNearestStation() {
    if (!network) return;
    if (!navigator.geolocation) {
      setLocationError("Location is not available in this browser. You can still choose a station manually.");
      return;
    }
    setLocationError("");
    setFindingLocation(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const location = { latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy };
        const nearest = network.stations
          .map((station) => ({ station, distance: distanceInKilometers(location, station) }))
          .sort((first, second) => first.distance - second.distance)[0];
        setUserLocation(location);
        setNearestStationId(nearest.station.id);
        setNearestDistance(nearest.distance);
        setRoute(null);
        setShowAllStops(false);
        setFindingLocation(false);
      },
      (locationFailure) => {
        const message = locationFailure.code === locationFailure.PERMISSION_DENIED
          ? "Location permission was not granted. Enable it in your browser or choose a station manually."
          : "We couldn’t determine your location. Please try again or choose a station manually.";
        setLocationError(message);
        setFindingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  function useNearestAsStart() {
    if (!nearestStationId) return;
    setOrigin(nearestStationId);
    setRoute(null);
    setShowAllStops(false);
  }

  function clearMap() {
    setOrigin("");
    setDestination("");
    setRoute(null);
    setShowAllStops(false);
    setError("");
    setLocationError("");
    setUserLocation(null);
    setNearestStationId("");
    setNearestDistance(null);
  }

  async function copyJourney() {
    if (!route) return;
    const text = `${route.origin.name} → ${route.destination.name} · ${route.durationMinutes} min · ₹${route.fareRupees}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const stationMap = useMemo(() => new Map(network?.stations.map((station) => [station.id, station]) ?? []), [network]);
  const nearestStation = nearestStationId ? stationMap.get(nearestStationId) ?? null : null;

  if (!network) {
    return <main className="app-loading"><span className="brand-mark"><TrainIcon /></span><strong>Drawing Bengaluru’s metro network…</strong>{error && <p>{error}</p>}</main>;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="BLRGo home">
          <span className="brand-mark"><TrainIcon /></span>
          <span><strong>BLRGo</strong><small>Move Bengaluru</small></span>
        </a>
        <div className="network-status"><i /> <span>{network.meta.stationCount} stations</span><b>·</b><span>{network.lines.length} lines</span></div>
        <nav><a href="#network">Network map</a><a href="#journey">Journey</a><span className="data-pill">Verified 28 Nov 2026</span></nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="kicker"><span /> Bengaluru, moving better</p>
          <h1>Move through Bengaluru.<br/><em>Start from where you are.</em></h1>
          <p>Find your nearest station or plan a trip across the live Namma Metro network.</p>
        </div>
        <div className="hero-art" aria-hidden="true"><span className="orbit one"/><span className="orbit two"/><span className="city-label">BLR</span></div>
      </section>

      <section className="planner-card" aria-label="Journey planner">
        <div className="location-launch">
          <span className="location-launch__icon"><LocationIcon /></span>
          <div>
            <small>Best place to begin</small>
            <strong>Find the metro station closest to you</strong>
            <p>See your position, nearest station, and distance directly on the map.</p>
          </div>
          <button type="button" className="near-me-button" onClick={findNearestStation} disabled={findingLocation}>
            <LocationIcon />
            <span><strong>{findingLocation ? "Finding your station…" : "Find station near me"}</strong><small>Uses your location only in this browser</small></span>
            <ArrowIcon />
          </button>
        </div>
        <div className="planner-divider"><span>or plan a journey</span></div>
        <div className="planner-inputs">
          <StationPicker label="Starting station" icon="from" stations={network.stations} value={origin} onChange={(id) => { setOrigin(id); setRoute(null); }} />
          <button className="swap-button" type="button" onClick={swapStations} aria-label="Swap origin and destination">
            <svg viewBox="0 0 24 24"><path d="m7 7 3-3 3 3M10 4v13m7 0-3 3-3-3m3 3V7"/></svg>
          </button>
          <StationPicker label="Destination" icon="to" stations={network.stations} value={destination} onChange={(id) => { setDestination(id); setRoute(null); }} />
        </div>
        <div className="planner-actions">
          <button className="plan-button" type="button" onClick={planJourney} disabled={!origin || !destination || origin === destination || loadingRoute}>
            <span>{loadingRoute ? "Finding the best route…" : "Plan my journey"}</span><ArrowIcon />
          </button>
          <button type="button" className="clear-map-button" onClick={clearMap} disabled={!origin && !destination && !route && !userLocation}><ResetIcon />Clear & view map</button>
        </div>
      </section>

      {(nearestStation || locationError) && (
        <section className={`location-result ${locationError ? "has-error" : ""}`} aria-live="polite">
          <span className="location-result__icon"><LocationIcon /></span>
          {nearestStation && nearestDistance !== null ? (
            <>
              <div><small>Nearest metro station</small><strong>{nearestStation.name}</strong><p>{formatDistance(nearestDistance)} away in a straight line · accuracy approximately ±{Math.round(userLocation?.accuracy ?? 0)} m</p></div>
              <button type="button" onClick={useNearestAsStart}>{origin === nearestStation.id ? "Selected as start" : "Use as starting station"}<ArrowIcon /></button>
            </>
          ) : (
            <div><small>Location unavailable</small><strong>Choose your station manually</strong><p>{locationError}</p></div>
          )}
        </section>
      )}

      {error && <div className="error-banner" role="alert"><span>!</span>{error}</div>}

      <section className="network-section" id="network">
        <div className="network-heading">
          <div><p className="section-label">Live network view</p><h2>All of Namma Metro, at a glance</h2></div>
          <div className="line-legend">{network.lines.map((line) => <span key={line.id}><i style={{ background: line.color }} />{line.name.replace(" Line", "")}</span>)}</div>
        </div>

        <div className={`travel-workspace ${route ? "has-route" : ""}`}>
          <div className="map-card">
            <MetroMap network={network} route={route} userLocation={userLocation} nearestStation={nearestStation} />
            <div className="map-note"><span>◎</span><div><strong>Live and future network</strong><small>Dashed routes are indicative, not live service. Select a station or future line for details.</small></div></div>
          </div>

          <aside className="journey-panel" id="journey">
            {!route ? (
              <div className="journey-empty">
                <div className="empty-illustration"><span className="route-dash"/><i/><i/><b><TrainIcon /></b></div>
                <p className="section-label">Ready when you are</p>
                <h2>Let’s find your way</h2>
                <p>Choose two stations above. We’ll show the best lines, every stop, where to change, and what the trip may cost.</p>
                <div className="quick-example">
                  <span>Try a popular route</span>
                  <button type="button" onClick={() => { setOrigin("KGWA"); setDestination("ETCT"); setRoute(null); }}>Majestic <ArrowIcon /> Electronic City</button>
                </div>
              </div>
            ) : (
              <div className="journey-result">
                <div className="result-topline"><p className="section-label">Your best route</p><div><button type="button" onClick={clearMap}>Clear route</button><button type="button" onClick={copyJourney}>{copied ? "Copied!" : "Share"}<svg viewBox="0 0 20 20"><path d="M10 13V3m0 0L6 7m4-4 4 4M5 10v6h10v-6"/></svg></button></div></div>
                <h2>{route.origin.name}<span><ArrowIcon /></span>{route.destination.name}</h2>
                <div className="route-colors">{route.segments.map((segment) => <i key={`${segment.line}-${segment.from.id}`} style={{ background: segment.color }} />)}</div>

                <div className="trip-metrics">
                  <div><span>Travel time</span><strong>{route.durationMinutes}<small> min</small></strong></div>
                  <div><span>Stops</span><strong>{route.stopCount}</strong></div>
                  <div><span>Interchanges</span><strong>{route.interchangeCount}</strong></div>
                  <div><span>Token fare</span><strong>₹{route.fareRupees}</strong></div>
                </div>

                <div className="segment-list">
                  {route.segments.map((segment, index) => (
                    <div className="segment-wrap" key={`${segment.line}-${segment.from.id}`}>
                      {index > 0 && <div className="interchange-card"><span>⇄</span><div><strong>Change at {segment.from.name}</strong><small>Follow signs for the {segment.lineName}{segment.platformCode ? ` · Platform ${segment.platformCode}` : " · Check station displays"}</small></div></div>}
                      <article className="segment-card" style={{ "--line-color": segment.color } as React.CSSProperties}>
                        <div className="segment-line"><span><TrainIcon /></span><div><strong>{segment.lineName}</strong><small>Towards {segment.direction}</small></div><div className="segment-badges"><b>{segment.stops.length - 1} stops</b><em className={segment.platformCode ? "verified" : "unavailable"}>{segment.platformCode ? `Platform ${segment.platformCode}` : "Platform: check displays"}</em></div></div>
                        <div className="segment-points"><div><i/><span>{segment.from.name}</span></div><div><i/><span>{segment.to.name}</span></div></div>
                      </article>
                    </div>
                  ))}
                </div>

                <button className="all-stops-button" type="button" onClick={() => setShowAllStops((current) => !current)}>
                  <span>{showAllStops ? "Hide" : "Show"} all {route.stops.length} stations</span><svg className={showAllStops ? "up" : ""} viewBox="0 0 20 20"><path d="m6 8 4 4 4-4"/></svg>
                </button>
                {showAllStops && <ol className="all-stops">{route.stops.map((stop, index) => <li key={stop.id}><span>{index + 1}</span><i style={{ background: network.lines.find((line) => line.id === stop.lines[0])?.color }} /><div><strong>{stop.name}</strong>{stop.lines.length > 1 && <small>Interchange · {stop.lines.map((line) => network.lines.find((item) => item.id === line)?.name).join(" / ")}</small>}</div></li>)}</ol>}
                <p className="fare-note">{route.fareSource}. Journey time includes a 5-minute allowance per interchange. Platform guidance comes from the community GTFS feed; always follow live station displays.</p>
              </div>
            )}
          </aside>
        </div>
      </section>

      <section className="line-directory">
        <div><p className="section-label">The whole network</p><h2>Four lines. One Bengaluru.</h2><p>Every currently operational station is available in search and on the map.</p></div>
        <div className="line-cards">{network.lines.map((line) => <article key={line.id}><i style={{ background: line.color }}/><span><strong>{line.name} route</strong><small>{line.stationIds.length} Namma Metro stations</small></span><b>{stationMap.get(line.stationIds[0])?.name}<ArrowIcon />{stationMap.get(line.stationIds.at(-1) ?? "")?.name}</b></article>)}</div>
      </section>

      <section className="metro-guide" aria-labelledby="metro-guide-title">
        <div className="metro-guide__intro">
          <p className="section-label">Bengaluru metro guide</p>
          <h2 id="metro-guide-title">Everything you need to plan a Namma Metro journey</h2>
          <p>BLRGo is a Bengaluru Metro route planner for checking the network map, station sequence, line changes, estimated fare and travel time before you leave.</p>
        </div>
        <div className="metro-guide__cards">
          <article>
            <span>01</span>
            <h3>Bengaluru Metro map and stations</h3>
            <p>Explore every operational Namma Metro station and see how the Purple, Green, Yellow and Pink lines connect across Bengaluru.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Purple, Green, Yellow and Pink Line routes</h3>
            <p>Plan a journey on one line or find the best interchange when your route moves between different metro lines.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Metro fare, travel time and nearest station</h3>
            <p>Compare estimated token fares and stop counts, then use your location to find the Bengaluru Metro station nearest to you.</p>
          </article>
        </div>
      </section>

      <footer><div className="brand"><span className="brand-mark"><TrainIcon /></span><span><strong>BLRGo</strong><small>Made for Bengaluru</small></span></div><p>Unofficial journey planner using BMRCL timetable-derived GTFS and OpenStreetMap data. Always verify live fares and service updates with BMRCL.</p><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a></footer>
    </main>
  );
}
