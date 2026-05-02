package com.skillsync.groupservice.config;

import org.junit.jupiter.api.Test;
import org.modelmapper.ModelMapper;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class ConfigClassesTest {

    @Test
    void modelMapperBeanCreated() {
        ModelMapper mapper = new ModelMapperConfig().modelMapper();
        assertNotNull(mapper);
    }

    @Test
    void securityCorsConfigCreated() {
        SecurityConfig securityConfig = new SecurityConfig(null);
        CorsConfigurationSource source = securityConfig.corsConfigurationSource();
        assertNotNull(source);
    }

    @Test
    void openApiConfigCanInstantiate() {
        assertNotNull(new OpenApiConfig());
    }
}
