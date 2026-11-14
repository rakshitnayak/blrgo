package com.nammametro.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

public record MetroNetwork(
        NetworkMeta meta,
        List<MetroLine> lines,
        List<Station> stations,
        List<Connection> connections,
        @JsonProperty(access = JsonProperty.Access.WRITE_ONLY) Map<String, Integer> fares) {}
