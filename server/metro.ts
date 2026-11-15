import networkJson from "../backend/src/main/resources/data/network.json";

type PlatformInfo = { code: string; line: string; towards: string[] };
type Station = {
  id: string;
  name: string;
  lines: string[];
  latitude: number;
  longitude: number;
  accessible: boolean;
  status: string;
  platforms: PlatformInfo[];
};
type MetroLine = {
  id: string;
  name: string;
  color: string;
  textColor: string;
  stationIds: string[];
  geometry: [number, number][];
};
type Connection = { from: string; to: string; line: string; minutes: number };
type Network = typeof networkJson & { fares: Record<string, number> };
type RouteState = { stationId: string; line: string };

export const network = networkJson as Network;

const INTERCHANGE_MINUTES = 5;

function stateKey(state: RouteState) {
  return `${state.stationId}|${state.line}`;
}

function directionFor(line: MetroLine, from: string, to: string, stations: Map<string, Station>) {
  const fromIndex = line.stationIds.indexOf(from);
  const toIndex = line.stationIds.indexOf(to);
  const terminalId = toIndex >= fromIndex ? line.stationIds[line.stationIds.length - 1] : line.stationIds[0];
  return stations.get(terminalId)!.name;
}

function platformFor(station: Station, lineId: string, direction: string) {
  return station.platforms
    ?.find((platform) => platform.line === lineId
      && platform.towards.some((towards) => towards.toLowerCase() === direction.toLowerCase()))
    ?.code ?? null;
}

export function findRoute(from: string, to: string) {
  const stations = new Map(network.stations.map((station) => [station.id, station as Station]));
  const lines = new Map(network.lines.map((line) => [line.id, line as MetroLine]));
  if (!stations.has(from) || !stations.has(to)) throw new Error("Unknown origin or destination station");
  if (from === to) throw new Error("Origin and destination must be different");

  const graph = new Map<string, Connection[]>();
  const addEdge = (edge: Connection) => graph.set(edge.from, [...(graph.get(edge.from) ?? []), edge]);
  for (const edge of network.connections as Connection[]) {
    addEdge(edge);
    addEdge({ from: edge.to, to: edge.from, line: edge.line, minutes: edge.minutes });
  }

  const start: RouteState = { stationId: from, line: "" };
  const distance = new Map<string, number>([[stateKey(start), 0]]);
  const previous = new Map<string, string>();
  const previousConnection = new Map<string, Connection>();
  const queue: Array<{ state: RouteState; cost: number }> = [{ state: start, cost: 0 }];
  let destination: RouteState | null = null;

  while (queue.length) {
    queue.sort((first, second) => first.cost - second.cost);
    const current = queue.shift()!;
    const currentKey = stateKey(current.state);
    if (current.cost !== distance.get(currentKey)) continue;
    if (current.state.stationId === to) {
      destination = current.state;
      break;
    }

    for (const edge of graph.get(current.state.stationId) ?? []) {
      const interchange = !current.state.line || current.state.line === edge.line ? 0 : INTERCHANGE_MINUTES;
      const next: RouteState = { stationId: edge.to, line: edge.line };
      const nextKey = stateKey(next);
      const candidate = current.cost + edge.minutes + interchange;
      if (candidate < (distance.get(nextKey) ?? Number.POSITIVE_INFINITY)) {
        distance.set(nextKey, candidate);
        previous.set(nextKey, currentKey);
        previousConnection.set(nextKey, edge);
        queue.push({ state: next, cost: candidate });
      }
    }
  }

  if (!destination) throw new Error("No route connects these stations");
  const destinationKey = stateKey(destination);
  const path: Connection[] = [];
  let cursor = destinationKey;
  while (cursor !== stateKey(start)) {
    path.push(previousConnection.get(cursor)!);
    cursor = previous.get(cursor)!;
  }
  path.reverse();

  const stops = [stations.get(from)!, ...path.map((edge) => stations.get(edge.to)!)];
  const segments = [];
  for (let index = 0; index < path.length;) {
    const lineId = path[index].line;
    let end = index;
    let durationMinutes = 0;
    const segmentStops = [stations.get(path[index].from)!];
    while (end < path.length && path[end].line === lineId) {
      durationMinutes += path[end].minutes;
      segmentStops.push(stations.get(path[end].to)!);
      end += 1;
    }
    const line = lines.get(lineId)!;
    const first = segmentStops[0];
    const last = segmentStops[segmentStops.length - 1];
    const direction = directionFor(line, first.id, last.id, stations);
    segments.push({
      line: lineId,
      lineName: line.name,
      color: line.color,
      direction,
      platformCode: platformFor(first, lineId, direction),
      from: first,
      to: last,
      stops: segmentStops,
      durationMinutes,
    });
    index = end;
  }

  const durationMinutes = distance.get(destinationKey)!;
  const exactFare = network.fares[`${from}:${to}`] ?? network.fares[`${to}:${from}`];
  const fareRupees = exactFare ?? Math.min(90, 10 + Math.ceil(durationMinutes / 5) * 5);

  return {
    origin: stations.get(from),
    destination: stations.get(to),
    stops,
    segments,
    durationMinutes,
    stopCount: path.length,
    interchangeCount: Math.max(0, segments.length - 1),
    fareRupees,
    fareSource: exactFare === undefined ? "Estimated — verify with BMRCL" : "Published GTFS fare matrix",
  };
}
