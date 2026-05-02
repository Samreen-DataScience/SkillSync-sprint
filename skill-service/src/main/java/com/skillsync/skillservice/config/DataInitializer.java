package com.skillsync.skillservice.config;

import com.skillsync.skillservice.entity.Skill;
import com.skillsync.skillservice.repository.SkillRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final SkillRepository skillRepository;
    private final CacheManager cacheManager;

    public DataInitializer(SkillRepository skillRepository, CacheManager cacheManager) {
        this.skillRepository = skillRepository;
        this.cacheManager = cacheManager;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedSkills(List.of(
                SkillSeed.of("Java", "Backend"),
                SkillSeed.of("Spring Boot", "Backend"),
                SkillSeed.of("REST APIs", "Backend"),
                SkillSeed.of("JPA", "Backend"),
                SkillSeed.of("React", "Frontend"),
                SkillSeed.of("TypeScript", "Frontend"),
                SkillSeed.of("Angular", "Frontend"),
                SkillSeed.of("Node.js", "Backend"),
                SkillSeed.of("Python", "Programming"),
                SkillSeed.of("Machine Learning", "AI"),
                SkillSeed.of("Data Structures", "Programming"),
                SkillSeed.of("Algorithms", "Programming"),
                SkillSeed.of("Docker", "DevOps"),
                SkillSeed.of("AWS", "Cloud")
        ));
    }

    private void seedSkills(List<SkillSeed> seeds) {
        int createdCount = 0;
        for (SkillSeed seed : seeds) {
            if (!skillRepository.existsByNameIgnoreCase(seed.name())) {
                skillRepository.save(Skill.builder()
                        .name(seed.name())
                        .category(seed.category())
                        .build());
                createdCount++;
            }
        }

        if (createdCount > 0 && cacheManager.getCache("skills") != null) {
            cacheManager.getCache("skills").clear();
        }
    }

    private record SkillSeed(String name, String category) {
        private static SkillSeed of(String name, String category) {
            return new SkillSeed(name, category);
        }
    }
}
