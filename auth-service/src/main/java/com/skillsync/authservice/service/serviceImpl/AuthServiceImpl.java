package com.skillsync.authservice.service.serviceImpl;

import com.skillsync.authservice.dto.AuthResponse;
import com.skillsync.authservice.dto.LoginRequest;
import com.skillsync.authservice.dto.RefreshTokenRequest;
import com.skillsync.authservice.dto.RegisterRequest;
import com.skillsync.authservice.entity.RefreshToken;
import com.skillsync.authservice.entity.RoleName;
import com.skillsync.authservice.entity.User;
import com.skillsync.authservice.exception.BusinessException;
import com.skillsync.authservice.exception.DuplicateResourceException;
import com.skillsync.authservice.exception.ResourceNotFoundException;
import com.skillsync.authservice.repository.RefreshTokenRepository;
import com.skillsync.authservice.repository.RoleRepository;
import com.skillsync.authservice.repository.UserRepository;
import com.skillsync.authservice.security.JwtService;
import com.skillsync.authservice.service.AuthService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtService jwtService;

    @Value("${security.jwt.expiration-ms}")
    private long jwtExpiry;

    @Value("${security.jwt.refresh-expiration-ms}")
    private long refreshExpiry;

    public AuthServiceImpl(UserRepository userRepository, RoleRepository roleRepository, RefreshTokenRepository refreshTokenRepository, PasswordEncoder passwordEncoder, AuthenticationManager authenticationManager, UserDetailsService userDetailsService, JwtService jwtService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtService = jwtService;
    }

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered");
        }

        Set<RoleName> roleNames = (request.getRoles() == null || request.getRoles().isEmpty())
                ? Set.of(RoleName.ROLE_LEARNER)
                : request.getRoles().stream().map(RoleName::valueOf).collect(Collectors.toSet());

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .enabled(true)
                .build();

        user.setRoles(roleNames.stream()
                .map(role -> roleRepository.findByName(role).orElseThrow(() -> new ResourceNotFoundException("Role not found")))
                .collect(Collectors.toSet()));

        return buildResponse(userRepository.save(user));
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        User user = userRepository.findByEmail(request.getEmail()).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return buildResponse(user);
    }

    @Override
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new BusinessException("Invalid refresh token"));
        if (refreshToken.isRevoked() || refreshToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Refresh token expired or revoked");
        }

        User user = refreshToken.getUser();
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String jwt = jwtService.generateToken(userDetails, user.getId(), user.getRoles().stream().map(r -> r.getName().name()).toList());

        return AuthResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .roles(user.getRoles().stream().map(r -> r.getName().name()).collect(Collectors.toSet()))
                .token(jwt)
                .refreshToken(refreshToken.getToken())
                .expiresIn(jwtExpiry)
                .build();
    }

    private AuthResponse buildResponse(User user) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String jwt = jwtService.generateToken(userDetails, user.getId(), user.getRoles().stream().map(r -> r.getName().name()).toList());

        RefreshToken refreshToken = RefreshToken.builder()
                .token(UUID.randomUUID() + "-" + UUID.randomUUID())
                .user(user)
                .expiryDate(LocalDateTime.now().plusSeconds(refreshExpiry / 1000))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .roles(user.getRoles().stream().map(r -> r.getName().name()).collect(Collectors.toSet()))
                .token(jwt)
                .refreshToken(refreshToken.getToken())
                .expiresIn(jwtExpiry)
                .build();
    }
}
