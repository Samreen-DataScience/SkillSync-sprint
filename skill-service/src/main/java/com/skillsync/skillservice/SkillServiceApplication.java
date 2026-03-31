package com.skillsync.skillservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class SkillServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(SkillServiceApplication.class, args);
    }
}
