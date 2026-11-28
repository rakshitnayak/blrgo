import { useEffect } from "react";

type Stop = { name: string; interchange?: string };
type Corridor = {
  id: string;
  name: string;
  phase: string;
  color: string;
  status: string;
  statusTone: "building" | "sanctioned" | "proposal";
  route: string;
  length: string;
  summary: string;
  note: string;
  stops: Stop[];
  sourceLabel: string;
  sourceUrl: string;
};

const corridors: Corridor[] = [
  {
    id: "pink-extension",
    name: "Pink Line · underground section",
    phase: "Phase 2 · Reach 6",
    color: "#e84393",
    status: "Under construction",
    statusTone: "building",
    route: "Dairy Circle to Nagawara",
    length: "12 planned stations",
    summary: "The next Pink Line section will carry the route north through the city centre and connect with the Purple and future Blue lines.",
    note: "The six-station Kalena Agrahara–S.G. Palya elevated section is already open. Opening dates for the underground section remain targets, not guarantees.",
    stops: [
      { name: "Dairy Circle", interchange: "Proposed Red Line" },
      { name: "Lakkasandra" },
      { name: "Langford Town" },
      { name: "Rashtriya Military School" },
      { name: "Mahatma Gandhi Road", interchange: "Purple Line" },
      { name: "Shivajinagar" },
      { name: "Cantonment Railway Station", interchange: "Indian Railways" },
      { name: "Pottery Town" },
      { name: "Tannery Road" },
      { name: "Venkateshpura" },
      { name: "Kadugondanahalli" },
      { name: "Nagawara", interchange: "Future Blue Line" },
    ],
    sourceLabel: "BMRCL Phase 2 project documents",
    sourceUrl: "https://data.opencity.in/dataset/bengaluru-metro-phase-2-documents",
  },
  {
    id: "blue-line",
    name: "Blue Line · ORR and airport",
    phase: "Phase 2A + 2B",
    color: "#1678d3",
    status: "Under construction",
    statusTone: "building",
    route: "Central Silk Board to Kempegowda International Airport",
    length: "58.19 km · 30 listed stops",
    summary: "Bengaluru’s airport corridor will follow the Outer Ring Road through major employment hubs before turning north via Hebbal to KIA.",
    note: "The line is planned to open in sections. BMRCL documents describe 13 Phase 2A stations and 17 Phase 2B stations; published counts can differ when the shared connection is counted.",
    stops: [
      { name: "Central Silk Board", interchange: "Yellow Line" },
      { name: "HSR Layout" },
      { name: "Agara Lake" },
      { name: "Iblur" },
      { name: "Bellandur" },
      { name: "Devarabeesanahalli" },
      { name: "Kadubeesanahalli" },
      { name: "Marathahalli" },
      { name: "ISRO (Karthik Nagar)" },
      { name: "Doddanekundi" },
      { name: "DRDO Sports Complex" },
      { name: "Mahadevapura" },
      { name: "Krishnarajapura", interchange: "Purple Line" },
      { name: "Kasturinagar" },
      { name: "Horamavu" },
      { name: "HRBR Layout" },
      { name: "Kalyan Nagar" },
      { name: "HBR Layout" },
      { name: "Nagawara", interchange: "Future Pink Line" },
      { name: "Veerannapalya" },
      { name: "Kempapura", interchange: "Future Phase 3" },
      { name: "Hebbal", interchange: "Future Phase 3 / Red Line" },
      { name: "Kodigehalli" },
      { name: "Jakkur Cross" },
      { name: "Yelahanka" },
      { name: "Bagalur Cross" },
      { name: "Bettahalasuru" },
      { name: "Doddajala" },
      { name: "Airport City" },
      { name: "Kempegowda International Airport" },
    ],
    sourceLabel: "BMRCL Metro Parking Policy 2026",
    sourceUrl: "https://www.bmrc.co.in/pd/FinalMetroParkingPolicy02-04-2026.pdf",
  },
  {
    id: "orange-line",
    name: "Phase 3 · ORR West corridor",
    phase: "Commonly called the Orange Line",
    color: "#ef7d32",
    status: "Sanctioned · preliminary works",
    statusTone: "sanctioned",
    route: "JP Nagar 4th Phase to Kempapura",
    length: "32.15 km · 22 stations",
    summary: "A western orbital connection linking south Bengaluru with Mysore Road, Nagarbhavi, Peenya, BEL Circle, Hebbal and the airport corridor.",
    note: "This corridor is centrally sanctioned. Station names are from BMRCL’s Phase 3 project presentation and may still receive final naming changes.",
    stops: [
      { name: "JP Nagar 4th Phase", interchange: "Pink Line" },
      { name: "JP Nagar 5th Phase" },
      { name: "JP Nagar", interchange: "Green Line" },
      { name: "Kadirenahalli" },
      { name: "Kamakya Junction" },
      { name: "Hosakerehalli" },
      { name: "Dwaraka Nagar" },
      { name: "Mysore Road", interchange: "Purple Line" },
      { name: "Nagarbhavi Circle" },
      { name: "Vinayaka Layout" },
      { name: "Papireddy Palya" },
      { name: "BDA Complex Nagarbhavi" },
      { name: "Sumanahalli Cross", interchange: "Phase 3 Magadi corridor" },
      { name: "Chowdeshwari Nagar" },
      { name: "Freedom Fighter’s Colony" },
      { name: "Kanteerava Nagar" },
      { name: "Peenya", interchange: "Green Line" },
      { name: "Muthyala Nagar" },
      { name: "BEL Circle" },
      { name: "Nagashettyhalli" },
      { name: "Hebbal Railway Station", interchange: "Indian Railways" },
      { name: "Kempapura", interchange: "Future Blue Line" },
    ],
    sourceLabel: "BMRCL Phase 3 project presentation",
    sourceUrl: "https://phase3laq.bmrc.co.in/EnvironmentalStakeholderMeetingPhase3Project.pdf",
  },
  {
    id: "magadi-corridor",
    name: "Phase 3 · Magadi Road corridor",
    phase: "Corridor 2 · final line name pending",
    color: "#64748b",
    status: "Sanctioned · preliminary works",
    statusTone: "sanctioned",
    route: "Hosahalli to Kadabagere",
    length: "12.50 km · 9 stations",
    summary: "A western extension from the Purple Line at Hosahalli, running through Kamakshipalya, Sumanahalli and Sunkadakatte to Kadabagere.",
    note: "This is the second sanctioned Phase 3 corridor. BLRGo avoids assigning an unofficial permanent colour name until BMRCL confirms one.",
    stops: [
      { name: "Hosahalli", interchange: "Purple Line" },
      { name: "KHB Colony" },
      { name: "Kamakshipalya" },
      { name: "Sumanahalli Cross", interchange: "Phase 3 ORR West" },
      { name: "Sunkadakatte" },
      { name: "Herohalli" },
      { name: "Byadarahalli" },
      { name: "Kamath Layout" },
      { name: "Kadabagere" },
    ],
    sourceLabel: "BMRCL Phase 3 project presentation",
    sourceUrl: "https://phase3laq.bmrc.co.in/EnvironmentalStakeholderMeetingPhase3Project.pdf",
  },
  {
    id: "red-line",
    name: "Proposed Red Line",
    phase: "Phase 3A · draft alignment",
    color: "#d63b3b",
    status: "Awaiting final central approval",
    statusTone: "proposal",
    route: "Sarjapur to Hebbal",
    length: "About 37.8 km · 27 draft stations",
    summary: "The proposed north–south-east corridor would connect Sarjapur, Bellandur, Koramangala and the central business district with Hebbal.",
    note: "This project is not yet sanctioned by the Union Cabinet. The 2026 DPR is under review, so alignment, station names, cost and dates can change.",
    stops: [
      { name: "Sarjapur" },
      { name: "Kada Agrahara Road" },
      { name: "Sompura" },
      { name: "Dommasandra" },
      { name: "Muthanallur Cross" },
      { name: "Ambedkar Nagar" },
      { name: "Carmelaram", interchange: "Indian Railways" },
      { name: "Doddakannelli" },
      { name: "Kaikondrahalli" },
      { name: "Bellandur Gate" },
      { name: "Ibbalur", interchange: "Future Blue Line" },
      { name: "Agara" },
      { name: "Jakkasandra" },
      { name: "Koramangala 3rd Block" },
      { name: "Koramangala 2nd Block" },
      { name: "Dairy Circle", interchange: "Future Pink Line" },
      { name: "NIMHANS" },
      { name: "Shanti Nagar" },
      { name: "Town Hall" },
      { name: "KR Circle", interchange: "Purple Line nearby" },
      { name: "Basaveshwara Circle" },
      { name: "Bengaluru Golf Course" },
      { name: "Palace Guttahalli" },
      { name: "Mehkri Circle" },
      { name: "Veterinary College" },
      { name: "Ganga Nagar" },
      { name: "Hebbal", interchange: "Future Blue / Phase 3" },
    ],
    sourceLabel: "Revised BMRCL Phase 3A DPR · February 2026",
    sourceUrl: "https://data.opencity.in/dataset/473c1390-9d72-4091-8889-7c9fce219d5c/resource/f981a62e-d56f-4276-8735-5f399c544412/download/dpr_phase-3a_23.02.2026-1-506.pdf",
  },
];

function TrainIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="15" rx="4"/><path d="M8 21l2-3m6 3-2-3M8 8h8M8 13h.01M16 13h.01"/></svg>;
}

export default function UpcomingNetwork() {
  useEffect(() => {
    document.title = "Upcoming Bengaluru Metro Lines & Stations | BLRGo";
  }, []);

  return (
    <main className="app-shell upcoming-page">
      <header className="topbar upcoming-topbar">
        <a className="brand" href="/" aria-label="BLRGo journey planner">
          <span className="brand-mark"><TrainIcon /></span>
          <span><strong>BLRGo</strong><small>Future network</small></span>
        </a>
        <nav><a href="/">Journey planner</a><a href="/#network">Live map</a><span className="data-pill">Verified 28 Nov 2026</span></nav>
      </header>

      <section className="upcoming-hero">
        <div>
          <p className="kicker"><span /> Bengaluru’s next connections</p>
          <h1>See what’s being built.<br/><em>Know what is still only proposed.</em></h1>
          <p>A clear view of upcoming Namma Metro corridors, published stops and their current approval status.</p>
          <div className="upcoming-hero__actions"><a href="#corridors">Explore every corridor</a><a href="/">Plan on the live network</a></div>
        </div>
        <div className="future-orbit" aria-hidden="true"><i/><i/><i/><i/><b>BLR<br/><span>NEXT</span></b></div>
      </section>

      <section className="future-summary" aria-label="Upcoming network summary">
        <article><span>Open now</span><strong>6 Pink Line stops</strong><small>Kalena Agrahara to S.G. Palya</small></article>
        <article><span>Being built</span><strong>Pink, Blue + Phase 3</strong><small>Construction and preliminary works</small></article>
        <article><span>Still proposed</span><strong>Red Line · 27 draft stops</strong><small>Final central approval pending</small></article>
      </section>

      <section className="pink-open-card">
        <div className="pink-open-card__line" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div>
        <div><p className="section-label">Latest network opening</p><h2>Pink Line priority section is running</h2><p>Passenger service began on 14 November 2026 across Kalena Agrahara, Hulimavu, Bilekahalli–IIMB, N.S. Palya–JP Nagar 4th Phase, Jayadeva Hospital and S.G. Palya.</p></div>
        <a href="/#network">View on the live map</a>
      </section>

      <section className="upcoming-corridors" id="corridors">
        <div className="upcoming-corridors__heading"><div><p className="section-label">Corridor by corridor</p><h2>Every published stop, without the hype</h2></div><p>Construction schedules move. BLRGo separates operational, sanctioned and proposed projects and shows the source behind each list.</p></div>
        <div className="corridor-list">
          {corridors.map((corridor, index) => (
            <article className="corridor-card" style={{ "--corridor-color": corridor.color } as React.CSSProperties} key={corridor.id}>
              <div className="corridor-card__accent" />
              <div className="corridor-card__content">
                <div className="corridor-card__topline"><span className={`project-status ${corridor.statusTone}`}>{corridor.status}</span><span>{corridor.phase}</span></div>
                <div className="corridor-card__title"><div><h3>{corridor.name}</h3><p>{corridor.route}</p></div><strong>{corridor.length}</strong></div>
                <p className="corridor-card__summary">{corridor.summary}</p>
                <details open={index === 0}>
                  <summary><span>View all stops</span><b>{corridor.stops.length}</b></summary>
                  <ol className="future-stops">
                    {corridor.stops.map((stop) => <li key={stop.name}><i/><span><strong>{stop.name}</strong>{stop.interchange && <small>{stop.interchange}</small>}</span></li>)}
                  </ol>
                </details>
                <div className="corridor-card__note"><p>{corridor.note}</p><a href={corridor.sourceUrl} target="_blank" rel="noreferrer">Source: {corridor.sourceLabel}</a></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="future-disclaimer"><strong>Plan journeys only on the live map</strong><p>Upcoming stations are for network awareness. They are excluded from route calculations, nearest-station results, fares and travel times until passenger service officially begins.</p><a href="/">Return to journey planner</a></section>

      <footer><div className="brand"><span className="brand-mark"><TrainIcon /></span><span><strong>BLRGo</strong><small>Made for Bengaluru</small></span></div><p>Upcoming-project information is compiled from BMRCL, Government of India and project documents. Names, alignments and target dates may change.</p><a href="/">Live journey planner</a></footer>
    </main>
  );
}
