package com.skillsync.authservice.service.serviceImpl;

import com.skillsync.authservice.dto.AuthResponse;
import com.skillsync.authservice.dto.LoginRequest;
import com.skillsync.authservice.dto.RefreshTokenRequest;
import com.skillsync.authservice.dto.RegisterRequest;
import com.skillsync.authservice.entity.RefreshToken;
import com.skillsync.authservice.entity.Role;
import com.skillsync.authservice.entity.RoleName;
import com.skillsync.authservice.entity.User;
import com.skillsync.authservice.exception.BusinessException;
import com.skillsync.authservice.exception.DuplicateResourceException;
import com.skillsync.authservice.repository.RefreshTokenRepository;
import com.skillsync.authservice.repository.RoleRepository;
import com.skillsync.authservice.repository.UserRepository;
import com.skillsync.authservice.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserDetailsService userDetailsService;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "jwtExpiry", 3600000L);
        ReflectionTestUtils.setField(authService, "refreshExpiry", 86400000L);
    }

    @Test
    void registerShouldAssignDefaultLearnerRoleAndReturnTokens() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Learner User");
        request.setEmail("learner@test.com");
        request.setPassword("Learner@123");

        Role learnerRole = Role.builder().id(1L).name(RoleName.ROLE_LEARNER).build();
        UserDetails userDetails = buildUserDetails("learner@test.com", "ROLE_LEARNER");

        when(userRepository.existsByEmail("learner@test.com")).thenReturn(false);
        when(passwordEncoder.encode("Learner@123")).thenReturn("encoded-pass");
        when(roleRepository.findByName(RoleName.ROLE_LEARNER)).thenReturn(Optional.of(learnerRole));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(10L);
            return user;
        });
        when(userDetailsService.loadUserByUsername("learner@test.com")).thenReturn(userDetails);
        when(jwtService.generateToken(eq(userDetails), eq(10L), anyList())).thenReturn("jwt-token");
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthResponse response = authService.register(request);

        assertEquals(10L, response.getUserId());
        assertEquals("learner@test.com", response.getEmail());
        assertEquals(Set.of("ROLE_LEARNER"), response.getRoles());
        assertEquals("jwt-token", response.getToken());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertEquals("encoded-pass", userCaptor.getValue().getPassword());
        assertEquals(RoleName.ROLE_LEARNER, userCaptor.getValue().getRoles().iterator().next().getName());
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void registerShouldAllowMentorButIgnoreAdminRole() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Public User");
        request.setEmail("public@test.com");
        request.setPassword("Public@123");
        request.setRoles(Set.of("ROLE_ADMIN", "ROLE_MENTOR"));

        Role mentorRole = Role.builder().id(2L).name(RoleName.ROLE_MENTOR).build();
        UserDetails userDetails = buildUserDetails("public@test.com", "ROLE_MENTOR");

        when(userRepository.existsByEmail("public@test.com")).thenReturn(false);
        when(passwordEncoder.encode("Public@123")).thenReturn("encoded-pass");
        when(roleRepository.findByName(RoleName.ROLE_MENTOR)).thenReturn(Optional.of(mentorRole));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(11L);
            return user;
        });
        when(userDetailsService.loadUserByUsername("public@test.com")).thenReturn(userDetails);
        when(jwtService.generateToken(eq(userDetails), eq(11L), anyList())).thenReturn("jwt-token");
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthResponse response = authService.register(request);

        assertEquals(Set.of("ROLE_MENTOR"), response.getRoles());
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertEquals(Set.of(RoleName.ROLE_MENTOR), userCaptor.getValue().getRoles().stream().map(Role::getName).collect(java.util.stream.Collectors.toSet()));
    }

    @Test
    void registerShouldThrowWhenEmailAlreadyExists() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("existing@test.com");

        when(userRepository.existsByEmail("existing@test.com")).thenReturn(true);

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class, () -> authService.register(request));

        assertEquals("Email already registered", ex.getMessage());
    }

    @Test
    void loginShouldAuthenticateAndReturnTokens() {
        LoginRequest request = new LoginRequest();
        request.setEmail("mentor@test.com");
        request.setPassword("Mentor@123");

        Role mentorRole = Role.builder().id(2L).name(RoleName.ROLE_MENTOR).build();
        User user = User.builder()
                .id(21L)
                .name("Mentor User")
                .email("mentor@test.com")
                .password("encoded-pass")
                .roles(Set.of(mentorRole))
                .build();
        UserDetails userDetails = buildUserDetails("mentor@test.com", "ROLE_MENTOR");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(org.mockito.Mockito.mock(Authentication.class));
        when(userRepository.findByEmail("mentor@test.com")).thenReturn(Optional.of(user));
        when(userDetailsService.loadUserByUsername("mentor@test.com")).thenReturn(userDetails);
        when(jwtService.generateToken(eq(userDetails), eq(21L), eq(List.of("ROLE_MENTOR")))).thenReturn("jwt-login");
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthResponse response = authService.login(request);

        assertEquals(21L, response.getUserId());
        assertEquals("jwt-login", response.getToken());
        assertEquals(Set.of("ROLE_MENTOR"), response.getRoles());
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void refreshShouldReturnNewJwtForActiveToken() {
        Role adminRole = Role.builder().id(3L).name(RoleName.ROLE_ADMIN).build();
        User user = User.builder()
                .id(50L)
                .name("Admin User")
                .email("admin@test.com")
                .password("encoded")
                .roles(Set.of(adminRole))
                .build();
        RefreshToken refreshToken = RefreshToken.builder()
                .token("refresh-ok")
                .user(user)
                .expiryDate(LocalDateTime.now().plusHours(1))
                .revoked(false)
                .build();
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("refresh-ok");
        UserDetails userDetails = buildUserDetails("admin@test.com", "ROLE_ADMIN");

        when(refreshTokenRepository.findByToken("refresh-ok")).thenReturn(Optional.of(refreshToken));
        when(userDetailsService.loadUserByUsername("admin@test.com")).thenReturn(userDetails);
        when(jwtService.generateToken(eq(userDetails), eq(50L), eq(List.of("ROLE_ADMIN")))).thenReturn("jwt-refreshed");

        AuthResponse response = authService.refresh(request);

        assertEquals(50L, response.getUserId());
        assertEquals("refresh-ok", response.getRefreshToken());
        assertEquals("jwt-refreshed", response.getToken());
        assertEquals(3600000L, response.getExpiresIn());
    }

    @Test
    void refreshShouldThrowWhenTokenIsRevoked() {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("bad-token");

        RefreshToken token = RefreshToken.builder()
                .token("bad-token")
                .revoked(true)
                .expiryDate(LocalDateTime.now().plusHours(1))
                .build();

        when(refreshTokenRepository.findByToken("bad-token")).thenReturn(Optional.of(token));

        BusinessException ex = assertThrows(BusinessException.class, () -> authService.refresh(request));

        assertEquals("Refresh token expired or revoked", ex.getMessage());
    }

    private UserDetails buildUserDetails(String username, String authority) {
        return org.springframework.security.core.userdetails.User
                .withUsername(username)
                .password("encoded-pass")
                .authorities(authority)
                .build();
    }
}
