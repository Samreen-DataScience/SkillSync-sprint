package com.skillsync.notificationservice.config;

import org.junit.jupiter.api.Test;
import org.modelmapper.ModelMapper;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.Queue;
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
        Queue queue = rabbitConfig.notificationQueue();
        TopicExchange exchange = rabbitConfig.notificationExchange();
        Binding binding = rabbitConfig.notificationBinding(queue, exchange);
        MessageConverter converter = rabbitConfig.messageConverter();

        assertEquals(RabbitConfig.QUEUE, queue.getName());
        assertEquals(RabbitConfig.EXCHANGE, exchange.getName());
        assertNotNull(binding);
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
