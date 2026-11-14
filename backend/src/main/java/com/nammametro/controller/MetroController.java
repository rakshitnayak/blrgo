package com.nammametro.controller;

import com.nammametro.model.MetroNetwork;
import com.nammametro.model.RouteResponse;
import com.nammametro.model.Station;
import com.nammametro.repository.NetworkRepository;
import com.nammametro.service.RouteService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class MetroController {
    private final NetworkRepository repository;
    private final RouteService routeService;

    public MetroController(NetworkRepository repository, RouteService routeService) {
        this.repository = repository;
        this.routeService = routeService;
    }

    @GetMapping("/network")
    public MetroNetwork network() {
        return repository.getNetwork();
    }

    @GetMapping("/stations")
    public List<Station> stations(@RequestParam(defaultValue = "") String query) {
        String normalized = query.trim().toLowerCase();
        return repository.getNetwork().stations().stream()
                .filter(station -> station.name().toLowerCase().contains(normalized))
                .toList();
    }

    @GetMapping("/routes")
    public RouteResponse route(@RequestParam String from, @RequestParam String to) {
        return routeService.findRoute(from, to);
    }
}
