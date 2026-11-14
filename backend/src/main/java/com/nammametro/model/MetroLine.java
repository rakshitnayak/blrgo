package com.nammametro.model;

import java.util.List;

public record MetroLine(
        String id,
        String name,
        String color,
        String textColor,
        List<String> stationIds,
        List<List<Double>> geometry) {}
