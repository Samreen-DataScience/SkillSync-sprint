package com.skillsync.authservice.config;

import com.skillsync.authservice.entity.Role;
import com.skillsync.authservice.entity.RoleName;
import com.skillsync.authservice.entity.User;
import com.skillsync.authservice.repository.RoleRepository;
import com.skillsync.authservice.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataInitializerTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Test
    void initRolesSavesOnlyMissingRoles() {
        when(roleRepository.findByName(RoleName.ROLE_ADMIN)).thenReturn(Optional.of(Role.builder().name(RoleName.ROLE_ADMIN).build()));
        when(roleRepository.findByName(RoleName.ROLE_LEARNER)).thenReturn(Optional.empty());
        when(roleRepository.findByName(RoleName.ROLE_MENTOR)).thenReturn(Optional.empty());

        DataInitializer initializer = new DataInitializer(roleRepository, userRepository, passwordEncoder, jdbcTemplate);
        initializer.initRoles();

        verify(roleRepository, times(2)).save(any(Role.class));
        verify(roleRepository, times(3)).findByName(any(RoleName.class));
    }

    @Test
    void initAdminUserCreatesDefaultAdminWhenMissing() {
        Role adminRole = Role.builder().name(RoleName.ROLE_ADMIN).build();
        when(userRepository.findByEmail("admin@gmail.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("admin@skillsync.com")).thenReturn(Optional.empty());
        when(roleRepository.findByName(RoleName.ROLE_ADMIN)).thenReturn(Optional.of(adminRole));
        when(passwordEncoder.encode("Admin@123")).thenReturn("encoded-password");

        DataInitializer initializer = new DataInitializer(roleRepository, userRepository, passwordEncoder, jdbcTemplate);
        initializer.initAdminUser();

        verify(userRepository).save(any(User.class));
    }

    @Test
    void initAdminUserUpdatesExistingAdmin() {
        Role adminRole = Role.builder().name(RoleName.ROLE_ADMIN).build();
        User existingAdmin = User.builder()
                .name("Old Admin")
                .email("admin@skillsync.com")
                .password("old-password")
                .enabled(false)
                .build();
        when(userRepository.findByEmail("admin@gmail.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("admin@skillsync.com")).thenReturn(Optional.of(existingAdmin));
        when(roleRepository.findByName(RoleName.ROLE_ADMIN)).thenReturn(Optional.of(adminRole));
        when(passwordEncoder.encode("Admin@123")).thenReturn("encoded-password");

        DataInitializer initializer = new DataInitializer(roleRepository, userRepository, passwordEncoder, jdbcTemplate);
        initializer.initAdminUser();

        verify(userRepository).save(existingAdmin);
    }

    @Test
    void initAdminUserMigratesLegacyLocalAdmin() {
        Role adminRole = Role.builder().name(RoleName.ROLE_ADMIN).build();
        User legacyAdmin = User.builder()
                .name("Admin")
                .email("admin@gmail.com")
                .password("old-password")
                .enabled(true)
                .build();
        when(roleRepository.findByName(RoleName.ROLE_ADMIN)).thenReturn(Optional.of(adminRole));
        when(userRepository.findByEmail("admin@gmail.com")).thenReturn(Optional.of(legacyAdmin));
        when(userRepository.existsByEmail("admin@skillsync.com")).thenReturn(false);
        when(passwordEncoder.encode("Admin@123")).thenReturn("encoded-password");

        DataInitializer initializer = new DataInitializer(roleRepository, userRepository, passwordEncoder, jdbcTemplate);
        initializer.initAdminUser();

        verify(userRepository).save(legacyAdmin);
    }
}
