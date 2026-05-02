package com.skillsync.authservice.config;

import org.junit.jupiter.api.Test;
import org.modelmapper.ModelMapper;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class ModelMapperConfigTest {

    @Test
    void modelMapperBeanIsCreated() {
        ModelMapper mapper = new ModelMapperConfig().modelMapper();
        assertNotNull(mapper);
    }
}
