package com.skillsync.userservice.repository;

import com.skillsync.userservice.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    Optional<UserProfile> findByAuthUserId(Long authUserId);
    boolean existsByEmail(String email);
    boolean existsByAuthUserId(Long authUserId);
}
