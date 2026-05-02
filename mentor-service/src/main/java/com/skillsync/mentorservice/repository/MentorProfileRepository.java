package com.skillsync.mentorservice.repository;

import com.skillsync.mentorservice.entity.MentorProfile;
import com.skillsync.mentorservice.entity.MentorStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface MentorProfileRepository extends JpaRepository<MentorProfile, Long>, JpaSpecificationExecutor<MentorProfile> {
    Optional<MentorProfile> findByUserId(Long userId);
    Optional<MentorProfile> findByEmailIgnoreCase(String email);
    Optional<MentorProfile> findByUserIdAndEmailIgnoreCase(Long userId, String email);
    long countByStatus(MentorStatus status);
}
