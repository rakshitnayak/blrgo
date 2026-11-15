package com.nammametro.model;

import java.util.List;

public record Station(
        String id,
        String name,
        List<String> lines,
        double latitude,
        double longitude,
        boolean accessible,
        String status,
        List<PlatformInfo> platforms) {}
