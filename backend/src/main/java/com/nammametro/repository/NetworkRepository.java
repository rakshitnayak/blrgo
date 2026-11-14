package com.nammametro.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nammametro.model.MetroNetwork;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Repository;

import java.io.IOException;

@Repository
public class NetworkRepository {
    private final MetroNetwork network;

    public NetworkRepository(ObjectMapper objectMapper) throws IOException {
        var resource = new ClassPathResource("data/network.json");
        this.network = objectMapper.readValue(resource.getInputStream(), MetroNetwork.class);
    }

    public MetroNetwork getNetwork() {
        return network;
    }
}
