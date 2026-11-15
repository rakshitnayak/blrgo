package com.nammametro.service;

import com.nammametro.model.Connection;
import com.nammametro.model.MetroLine;
import com.nammametro.model.PlatformInfo;
import com.nammametro.model.RouteResponse;
import com.nammametro.model.RouteSegment;
import com.nammametro.model.Station;
import com.nammametro.repository.NetworkRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.stream.Collectors;

@Service
public class RouteService {
    private static final int INTERCHANGE_MINUTES = 5;
    private final NetworkRepository repository;

    public RouteService(NetworkRepository repository) {
        this.repository = repository;
    }

    public RouteResponse findRoute(String from, String to) {
        var network = repository.getNetwork();
        var stations = network.stations().stream()
                .collect(Collectors.toMap(Station::id, station -> station));
        var lines = network.lines().stream()
                .collect(Collectors.toMap(MetroLine::id, line -> line));

        if (!stations.containsKey(from) || !stations.containsKey(to)) {
            throw new IllegalArgumentException("Unknown origin or destination station");
        }
        if (from.equals(to)) {
            throw new IllegalArgumentException("Origin and destination must be different");
        }

        Map<String, List<Connection>> graph = buildGraph(network.connections());
        RouteState start = new RouteState(from, "");
        Map<RouteState, Integer> distance = new HashMap<>();
        Map<RouteState, RouteState> previous = new HashMap<>();
        Map<RouteState, Connection> previousConnection = new HashMap<>();
        PriorityQueue<Node> queue = new PriorityQueue<>(Comparator.comparingInt(Node::cost));
        distance.put(start, 0);
        queue.add(new Node(start, 0));
        RouteState destinationState = null;

        while (!queue.isEmpty()) {
            Node current = queue.poll();
            if (current.cost() != distance.getOrDefault(current.state(), Integer.MAX_VALUE)) continue;
            if (current.state().stationId().equals(to)) {
                destinationState = current.state();
                break;
            }

            for (Connection edge : graph.getOrDefault(current.state().stationId(), List.of())) {
                int interchange = current.state().line().isBlank() || current.state().line().equals(edge.line())
                        ? 0 : INTERCHANGE_MINUTES;
                RouteState next = new RouteState(edge.to(), edge.line());
                int candidate = current.cost() + edge.minutes() + interchange;
                if (candidate < distance.getOrDefault(next, Integer.MAX_VALUE)) {
                    distance.put(next, candidate);
                    previous.put(next, current.state());
                    previousConnection.put(next, edge);
                    queue.add(new Node(next, candidate));
                }
            }
        }

        if (destinationState == null) {
            throw new IllegalStateException("No route connects these stations");
        }

        List<Connection> path = reconstructPath(destinationState, start, previous, previousConnection);
        List<Station> stops = new ArrayList<>();
        stops.add(stations.get(from));
        path.forEach(connection -> stops.add(stations.get(connection.to())));
        List<RouteSegment> segments = buildSegments(path, stations, lines);
        Fare fare = resolveFare(from, to, distance.get(destinationState), network.fares());

        return new RouteResponse(
                stations.get(from), stations.get(to), stops, segments,
                distance.get(destinationState), path.size(), Math.max(0, segments.size() - 1),
                fare.amount(), fare.source());
    }

    private Map<String, List<Connection>> buildGraph(List<Connection> connections) {
        Map<String, List<Connection>> graph = new HashMap<>();
        for (Connection connection : connections) {
            graph.computeIfAbsent(connection.from(), ignored -> new ArrayList<>()).add(connection);
            graph.computeIfAbsent(connection.to(), ignored -> new ArrayList<>())
                    .add(new Connection(connection.to(), connection.from(), connection.line(), connection.minutes()));
        }
        return graph;
    }

    private List<Connection> reconstructPath(
            RouteState destination,
            RouteState start,
            Map<RouteState, RouteState> previous,
            Map<RouteState, Connection> previousConnection) {
        List<Connection> path = new ArrayList<>();
        RouteState cursor = destination;
        while (!cursor.equals(start)) {
            path.add(previousConnection.get(cursor));
            cursor = previous.get(cursor);
        }
        Collections.reverse(path);
        return path;
    }

    private List<RouteSegment> buildSegments(
            List<Connection> path,
            Map<String, Station> stations,
            Map<String, MetroLine> lines) {
        List<RouteSegment> segments = new ArrayList<>();
        int index = 0;
        while (index < path.size()) {
            String lineId = path.get(index).line();
            int end = index;
            int minutes = 0;
            List<Station> segmentStops = new ArrayList<>();
            segmentStops.add(stations.get(path.get(index).from()));
            while (end < path.size() && path.get(end).line().equals(lineId)) {
                minutes += path.get(end).minutes();
                segmentStops.add(stations.get(path.get(end).to()));
                end += 1;
            }
            MetroLine line = lines.get(lineId);
            Station first = segmentStops.getFirst();
            Station last = segmentStops.getLast();
            String direction = directionFor(line, first.id(), last.id(), stations);
            segments.add(new RouteSegment(
                    lineId, line.name(), line.color(), direction, platformFor(first, lineId, direction),
                    first, last, segmentStops, minutes));
            index = end;
        }
        return segments;
    }

    private String directionFor(MetroLine line, String from, String to, Map<String, Station> stations) {
        int fromIndex = line.stationIds().indexOf(from);
        int toIndex = line.stationIds().indexOf(to);
        String terminalId = toIndex >= fromIndex ? line.stationIds().getLast() : line.stationIds().getFirst();
        return stations.get(terminalId).name();
    }

    private String platformFor(Station station, String lineId, String direction) {
        if (station.platforms() == null) return null;
        return station.platforms().stream()
                .filter(platform -> platform.line().equals(lineId))
                .filter(platform -> platform.towards().stream().anyMatch(direction::equalsIgnoreCase))
                .map(PlatformInfo::code)
                .findFirst()
                .orElse(null);
    }

    private Fare resolveFare(String from, String to, int duration, Map<String, Integer> fares) {
        Integer exact = fares.get(from + ":" + to);
        if (exact == null) exact = fares.get(to + ":" + from);
        if (exact != null) return new Fare(exact, "Published GTFS fare matrix");
        int estimate = Math.min(90, 10 + ((duration + 4) / 5) * 5);
        return new Fare(estimate, "Estimated — verify with BMRCL");
    }

    private record RouteState(String stationId, String line) {}
    private record Node(RouteState state, int cost) {}
    private record Fare(int amount, String source) {}
}
