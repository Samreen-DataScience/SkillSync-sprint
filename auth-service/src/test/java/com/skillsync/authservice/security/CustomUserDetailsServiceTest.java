package com.skillsync.authservice.security;

import com.skillsync.authservice.entity.Role;
import com.skillsync.authservice.entity.RoleName;
import com.skillsync.authservice.entity.User;
import com.skillsync.authservice.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    private CustomUserDetailsService service;

    @BeforeEach
    void setUp() {
        service = new CustomUserDetailsService(userRepository);
    }

    @Test
    void loadUserByUsernameReturnsUserDetails() {
        User user = User.builder()
                .email("mentor@skillsync.com")
                .password("encoded")
                .enabled(true)
                .roles(Set.of(Role.builder().name(RoleName.ROLE_MENTOR).build()))
                .build();
        when(userRepository.findByEmail("mentor@skillsync.com")).thenReturn(java.util.Optional.of(user));

        var result = service.loadUserByUsername("mentor@skillsync.com");

        assertEquals("mentor@skillsync.com", result.getUsername());
        assertEquals("encoded", result.getPassword());
    }

    @Test
    void loadUserByUsernameThrowsWhenMissing() {
        when(userRepository.findByEmail("missing@skillsync.com")).thenReturn(java.util.Optional.empty());

        assertThrows(UsernameNotFoundException.class, () -> service.loadUserByUsername("missing@skillsync.com"));
    }
}
