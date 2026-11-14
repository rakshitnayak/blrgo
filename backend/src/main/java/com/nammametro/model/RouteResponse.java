package com.nammametro.model;

import java.util.List;

public record RouteResponse(
        Station origin,
        Station destination,
        List<Station> stops,
        List<RouteSegment> segments,
        int durationMinutes,
        int stopCount,
        int interchangeCount,
        int fareRupees,
        String fareSource) {}
