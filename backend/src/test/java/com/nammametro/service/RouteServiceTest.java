package com.nammametro.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nammametro.repository.NetworkRepository;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RouteServiceTest {
    private final RouteService service;

    RouteServiceTest() throws Exception {
        service = new RouteService(new NetworkRepository(new ObjectMapper()));
    }

    @Test
    void findsRouteAcrossAnInterchange() {
        var route = service.findRoute("WHTM", "APTS");

        assertThat(route.stops()).extracting("id")
                .startsWith("WHTM", "UWVL", "KDGD")
                .endsWith("VJRH", "TGTP", "APTS");
        assertThat(route.interchangeCount()).isEqualTo(1);
        assertThat(route.segments()).extracting("line").containsExactly("purple", "green");
        assertThat(route.segments()).extracting("platformCode").containsExactly("2", "4");
        assertThat(route.stopCount()).isEqualTo(route.stops().size() - 1);
    }

    @Test
    void routesThroughTheNewPinkLineInterchange() {
        var route = service.findRoute("PNKA", "BMSD");

        assertThat(route.segments()).extracting("line").containsExactly("pink", "yellow");
        assertThat(route.segments()).extracting("platformCode").containsExactly(null, "2");
        assertThat(route.stops()).extracting("id").contains("PNKJ", "JDHP", "ETCT");
    }
}
