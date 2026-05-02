package com.skillsync.authservice.config;

import com.skillsync.authservice.entity.Role;
import com.skillsync.authservice.entity.RoleName;
import com.skillsync.authservice.entity.User;
import com.skillsync.authservice.repository.RoleRepository;
import com.skillsync.authservice.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class DataInitializer {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Value("${skillsync.seed.admin.email:admin@skillsync.com}")
    private String adminEmail = "admin@skillsync.com";

    @Value("${skillsync.seed.admin.password:Admin@123}")
    private String adminPassword = "Admin@123";

    @Value("${skillsync.seed.admin.name:Admin User}")
    private String adminName = "Admin User";

    public DataInitializer(RoleRepository roleRepository, UserRepository userRepository, PasswordEncoder passwordEncoder, JdbcTemplate jdbcTemplate) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void initData() {
        initRoles();
        initAdminUser();
        protectAuthIdsFromOldMentorProfiles();
    }

    void initRoles() {
        for (RoleName roleName : RoleName.values()) {
            roleRepository.findByName(roleName).orElseGet(() -> roleRepository.save(Role.builder().name(roleName).build()));
        }
    }

    void initAdminUser() {
        Role adminRole = roleRepository.findByName(RoleName.ROLE_ADMIN)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.ROLE_ADMIN).build()));

        boolean migratedLegacyAdmin = userRepository.findByEmail("admin@gmail.com")
                .filter((legacyAdmin) -> !adminEmail.equalsIgnoreCase(legacyAdmin.getEmail()) && !userRepository.existsByEmail(adminEmail))
                .map((legacyAdmin) -> {
                    legacyAdmin.setEmail(adminEmail);
                    legacyAdmin.setPassword(passwordEncoder.encode(adminPassword));
                    legacyAdmin.setName(adminName);
                    legacyAdmin.setEnabled(true);
                    legacyAdmin.setRoles(Set.of(adminRole));
                    userRepository.save(legacyAdmin);
                    return true;
                })
                .orElse(false);

        if (migratedLegacyAdmin) {
            return;
        }

        var existingAdmin = userRepository.findByEmail(adminEmail);
        if (existingAdmin.isPresent()) {
            User admin = existingAdmin.get();
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setName(adminName);
            admin.setEnabled(true);
            admin.setRoles(Set.of(adminRole));
            userRepository.save(admin);
            return;
        }

        User admin = User.builder()
                .name(adminName)
                .email(adminEmail)
                .password(passwordEncoder.encode(adminPassword))
                .enabled(true)
                .roles(Set.of(adminRole))
                .build();

        userRepository.save(admin);
    }

    void protectAuthIdsFromOldMentorProfiles() {
        try {
            Long maxAuthUserId = jdbcTemplate.queryForObject("SELECT COALESCE(MAX(id), 0) FROM users", Long.class);
            Long maxMentorUserId = jdbcTemplate.queryForObject("SELECT COALESCE(MAX(user_id), 0) FROM skillsync_mentor_db.mentor_profiles", Long.class);
            long nextId = Math.max(maxAuthUserId == null ? 0 : maxAuthUserId, maxMentorUserId == null ? 0 : maxMentorUserId) + 1;
            jdbcTemplate.execute("ALTER TABLE users AUTO_INCREMENT = " + nextId);
        } catch (Exception ignored) {
        }
    }
}
