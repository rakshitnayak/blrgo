package com.nammametro.model;

import java.util.List;

public record RouteSegment(
        String line,
        String lineName,
        String color,
        String direction,
        String platformCode,
        Station from,
        Station to,
        List<Station> stops,
        int durationMinutes) {}
