import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Station } from "../types";

type Props = {
  label: string;
  icon: "from" | "to";
  stations: Station[];
  value: string;
  onChange: (stationId: string) => void;
};

export function StationPicker({ label, icon, stations, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();
  const selected = stations.find((station) => station.id === value);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return stations;
    return stations.filter((station) => station.name.toLowerCase().includes(normalized));
  }, [query, stations]);

  useEffect(() => {
    if (!open) return;

    function closeWhenTappingOutside(event: PointerEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeWithEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", closeWhenTappingOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeWhenTappingOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [open]);

  function choose(station: Station) {
    onChange(station.id);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={pickerRef} className={`station-picker ${open ? "open" : ""}`}>
      <span className={`picker-marker ${icon}`} aria-hidden="true"><i /></span>
      <button ref={triggerRef} type="button" className="picker-trigger" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-controls={listboxId} aria-haspopup="listbox">
        <span>{label}</span>
        <strong>{selected?.name ?? "Choose a station"}</strong>
      </button>
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6 8 4 4 4-4" /></svg>
      {open && (
        <div className="station-menu">
          <div className="station-search">
            <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5"/><path d="m12.5 12.5 4 4"/></svg>
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search all stations" aria-label={`Search ${label.toLowerCase()} stations`} />
          </div>
          <div className="station-options" id={listboxId} role="listbox" aria-label={`${label} options`}>
            {filtered.map((station) => (
              <button type="button" role="option" aria-selected={station.id === value} key={station.id} onClick={() => choose(station)} className={station.id === value ? "selected" : ""}>
                <span className="line-dots">{station.lines.map((line) => <i key={line} className={line} />)}</span>
                <span><strong>{station.name}</strong><small>{station.lines.map((line) => `${line[0].toUpperCase()}${line.slice(1)} Line`).join(" · ")}</small></span>
                {station.id === value && <b>✓</b>}
              </button>
            ))}
            {!filtered.length && <p>No stations match “{query}”</p>}
          </div>
        </div>
      )}
    </div>
  );
}
