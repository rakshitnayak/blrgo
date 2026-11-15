#!/usr/bin/env python3
"""Add platform and direction metadata from a BMRCL GTFS zip to network.json."""

import argparse
import csv
import io
import json
import zipfile
from collections import defaultdict
from pathlib import Path


def read_table(archive: zipfile.ZipFile, name: str) -> list[dict[str, str]]:
    with archive.open(name) as source:
        text = io.TextIOWrapper(source, encoding="utf-8-sig")
        return list(csv.DictReader(text))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--gtfs", required=True, type=Path)
    parser.add_argument("--network", required=True, type=Path)
    args = parser.parse_args()

    with zipfile.ZipFile(args.gtfs) as archive:
        stops = {row["stop_id"]: row for row in read_table(archive, "stops.txt")}
        trips = {row["trip_id"]: row for row in read_table(archive, "trips.txt")}
        stop_times = read_table(archive, "stop_times.txt")

    assignments: dict[str, dict[tuple[str, str], set[str]]] = defaultdict(
        lambda: defaultdict(set)
    )
    for stop_time in stop_times:
        stop = stops.get(stop_time["stop_id"])
        trip = trips.get(stop_time["trip_id"])
        if not stop or not trip or not stop.get("parent_station") or not stop.get("platform_code"):
            continue
        headsign = stop_time.get("stop_headsign") or trip.get("trip_headsign")
        if not headsign:
            continue
        line = trip["route_id"].lower()
        assignments[stop["parent_station"]][(line, stop["platform_code"])].add(headsign)

    network = json.loads(args.network.read_text(encoding="utf-8"))
    enriched = 0
    platform_count = 0
    for station in network["stations"]:
        station_platforms = assignments.get(station["id"], {})
        station["platforms"] = [
            {"code": code, "line": line, "towards": sorted(towards)}
            for (line, code), towards in sorted(station_platforms.items())
        ]
        if station["platforms"]:
            enriched += 1
            platform_count += len(station["platforms"])

    network["meta"]["platformData"] = (
        "Community GTFS platform assignments; always follow live station displays."
    )
    args.network.write_text(
        json.dumps(network, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Added {platform_count} platform assignments across {enriched} stations")


if __name__ == "__main__":
    main()
