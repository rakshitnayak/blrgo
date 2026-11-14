import { useEffect, useMemo, useState } from "react";
import { MetroMap } from "./components/MetroMap";
import { StationPicker } from "./components/StationPicker";
import type { Network, Route } from "./types";

function TrainIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="15" rx="4"/><path d="M8 21l2-3m6 3-2-3M8 8h8M8 13h.01M16 13h.01"/></svg>;
}

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>;
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
    if (origin === destination) return;
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

  async function copyJourney() {
    if (!route) return;
    const text = `${route.origin.name} → ${route.destination.name} · ${route.durationMinutes} min · ₹${route.fareRupees}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const stationMap = useMemo(() => new Map(network?.stations.map((station) => [station.id, station]) ?? []), [network]);

  if (!network) {
    return <main className="app-loading"><span className="brand-mark"><TrainIcon /></span><strong>Drawing Bengaluru’s metro network…</strong>{error && <p>{error}</p>}</main>;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Namma Go home">
          <span className="brand-mark"><TrainIcon /></span>
          <span><strong>Namma Go</strong><small>Bengaluru Metro</small></span>
        </a>
        <div className="network-status"><i /> <span>{network.meta.stationCount} stations</span><b>·</b><span>{network.lines.length} lines</span></div>
        <nav><a href="#network">Network map</a><a href="#journey">Journey</a><span className="data-pill">Updated Nov 2026</span></nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="kicker"><span /> Bengaluru, connected</p>
          <h1>Your city.<br/><em>One smooth ride.</em></h1>
          <p>Plan across every operational Namma Metro line with clear interchanges, station-by-station guidance, and fare estimates.</p>
        </div>
        <div className="hero-art" aria-hidden="true"><span className="orbit one"/><span className="orbit two"/><span className="city-label">BLR<br/><b>12.97°N</b></span></div>
      </section>

      <section className="planner-card" aria-label="Journey planner">
        <div className="planner-inputs">
          <StationPicker label="Starting station" icon="from" stations={network.stations} value={origin} onChange={(id) => { setOrigin(id); setRoute(null); }} />
          <button className="swap-button" type="button" onClick={swapStations} aria-label="Swap origin and destination">
            <svg viewBox="0 0 24 24"><path d="m7 7 3-3 3 3M10 4v13m7 0-3 3-3-3m3 3V7"/></svg>
          </button>
          <StationPicker label="Destination" icon="to" stations={network.stations} value={destination} onChange={(id) => { setDestination(id); setRoute(null); }} />
        </div>
        <button className="plan-button" type="button" onClick={planJourney} disabled={origin === destination || loadingRoute}>
          <span>{loadingRoute ? "Finding the best route…" : "Plan my journey"}</span><ArrowIcon />
        </button>
      </section>

      {error && <div className="error-banner" role="alert"><span>!</span>{error}</div>}

      <section className="network-section" id="network">
        <div className="network-heading">
          <div><p className="section-label">Live network view</p><h2>All of Namma Metro, at a glance</h2></div>
          <div className="line-legend">{network.lines.map((line) => <span key={line.id}><i style={{ background: line.color }} />{line.name.replace(" Line", "")}</span>)}</div>
        </div>

        <div className={`travel-workspace ${route ? "has-route" : ""}`}>
          <div className="map-card">
            <MetroMap network={network} route={route} />
            <div className="map-note"><span>◎</span><div><strong>Tip</strong><small>Click any station for its name. Use the controls to zoom or locate yourself.</small></div></div>
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
                <div className="result-topline"><p className="section-label">Your best route</p><button type="button" onClick={copyJourney}>{copied ? "Copied!" : "Share"}<svg viewBox="0 0 20 20"><path d="M10 13V3m0 0L6 7m4-4 4 4M5 10v6h10v-6"/></svg></button></div>
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
                      {index > 0 && <div className="interchange-card"><span>⇄</span><div><strong>Change at {segment.from.name}</strong><small>Follow signs for the {segment.lineName}</small></div></div>}
                      <article className="segment-card" style={{ "--line-color": segment.color } as React.CSSProperties}>
                        <div className="segment-line"><span><TrainIcon /></span><div><strong>{segment.lineName}</strong><small>Towards {segment.direction}</small></div><b>{segment.stops.length - 1} stops</b></div>
                        <div className="segment-points"><div><i/><span>{segment.from.name}</span></div><div><i/><span>{segment.to.name}</span></div></div>
                      </article>
                    </div>
                  ))}
                </div>

                <button className="all-stops-button" type="button" onClick={() => setShowAllStops((current) => !current)}>
                  <span>{showAllStops ? "Hide" : "Show"} all {route.stops.length} stations</span><svg className={showAllStops ? "up" : ""} viewBox="0 0 20 20"><path d="m6 8 4 4 4-4"/></svg>
                </button>
                {showAllStops && <ol className="all-stops">{route.stops.map((stop, index) => <li key={stop.id}><span>{index + 1}</span><i style={{ background: network.lines.find((line) => line.id === stop.lines[0])?.color }} /><div><strong>{stop.name}</strong>{stop.lines.length > 1 && <small>Interchange · {stop.lines.map((line) => network.lines.find((item) => item.id === line)?.name).join(" / ")}</small>}</div></li>)}</ol>}
                <p className="fare-note">{route.fareSource}. Journey time includes a 5-minute allowance per interchange.</p>
              </div>
            )}
          </aside>
        </div>
      </section>

      <section className="line-directory">
        <div><p className="section-label">The whole network</p><h2>Four lines. One Bengaluru.</h2><p>Every currently operational station is available in search and on the map, including the newly opened Pink Line section.</p></div>
        <div className="line-cards">{network.lines.map((line) => <article key={line.id}><i style={{ background: line.color }}/><span><strong>{line.name}</strong><small>{line.stationIds.length} stations</small></span><b>{stationMap.get(line.stationIds[0])?.name}<ArrowIcon />{stationMap.get(line.stationIds.at(-1) ?? "")?.name}</b></article>)}</div>
      </section>

      <footer><div className="brand"><span className="brand-mark"><TrainIcon /></span><span><strong>Namma Go</strong><small>Made for Bengaluru</small></span></div><p>Unofficial journey planner using BMRCL timetable-derived GTFS and OpenStreetMap data. Always verify live fares and service updates with BMRCL.</p><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></footer>
    </main>
  );
}
