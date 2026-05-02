package com.skillsync.sessionservice.config;

import org.junit.jupiter.api.Test;
import org.modelmapper.ModelMapper;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class ConfigClassesTest {

    @Test
    void modelMapperBeanCreated() {
        ModelMapper mapper = new ModelMapperConfig().modelMapper();
        assertNotNull(mapper);
    }

    @Test
    void rabbitBeansCreated() {
        RabbitConfig rabbitConfig = new RabbitConfig();
        TopicExchange exchange = rabbitConfig.notificationExchange();
        MessageConverter converter = rabbitConfig.messageConverter();

        assertEquals(RabbitConfig.EXCHANGE, exchange.getName());
        assertNotNull(converter);
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
