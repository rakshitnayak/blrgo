package com.nammametro.model;

public record NetworkMeta(
        String name,
        String generatedAt,
        String dataVersion,
        int stationCount,
        String disclaimer,
        String platformData) {}
