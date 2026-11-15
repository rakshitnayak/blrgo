package com.nammametro.model;

import java.util.List;

public record PlatformInfo(
        String code,
        String line,
        List<String> towards) {}
