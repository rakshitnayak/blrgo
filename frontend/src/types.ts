export type LineId = "purple" | "green" | "yellow" | "pink";

export type Station = {
  id: string;
  name: string;
  lines: LineId[];
  latitude: number;
  longitude: number;
  accessible: boolean;
  status: string;
};

export type MetroLine = {
  id: LineId;
  name: string;
  color: string;
  textColor: string;
  stationIds: string[];
  geometry: [number, number][];
};

export type Connection = { from: string; to: string; line: LineId; minutes: number };

export type Network = {
  meta: {
    name: string;
    generatedAt: string;
    dataVersion: string;
    stationCount: number;
    disclaimer: string;
  };
  lines: MetroLine[];
  stations: Station[];
  connections: Connection[];
};

export type RouteSegment = {
  line: LineId;
  lineName: string;
  color: string;
  direction: string;
  from: Station;
  to: Station;
  stops: Station[];
  durationMinutes: number;
};

export type Route = {
  origin: Station;
  destination: Station;
  stops: Station[];
  segments: RouteSegment[];
  durationMinutes: number;
  stopCount: number;
  interchangeCount: number;
  fareRupees: number;
  fareSource: string;
};
