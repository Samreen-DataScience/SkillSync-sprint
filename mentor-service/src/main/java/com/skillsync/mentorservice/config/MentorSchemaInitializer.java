package com.skillsync.mentorservice.config;

import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class MentorSchemaInitializer {

    private final JdbcTemplate jdbcTemplate;

    public MentorSchemaInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void relaxUserIdUniqueness() {
        try {
            List<String> indexes = jdbcTemplate.queryForList("""
                    SELECT DISTINCT INDEX_NAME
                    FROM INFORMATION_SCHEMA.STATISTICS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'mentor_profiles'
                      AND COLUMN_NAME IN ('user_id', 'userId')
                      AND NON_UNIQUE = 0
                      AND INDEX_NAME <> 'PRIMARY'
                    """, String.class);

            for (String index : indexes) {
                jdbcTemplate.execute("ALTER TABLE mentor_profiles DROP INDEX `" + index.replace("`", "``") + "`");
            }
        } catch (Exception ignored) {
        }
    }
}
