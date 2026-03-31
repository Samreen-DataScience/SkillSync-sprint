package com.skillsync.sessionservice.repository;

import com.skillsync.sessionservice.entity.MentorshipSession;
import com.skillsync.sessionservice.entity.SessionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MentorshipSessionRepository extends JpaRepository<MentorshipSession, Long> {
    Page<MentorshipSession> findByLearnerIdOrMentorId(Long learnerId, Long mentorId, Pageable pageable);

    long countByLearnerIdOrMentorId(Long learnerId, Long mentorId);

    @Query("select count(s) from MentorshipSession s where (s.learnerId = :userId or s.mentorId = :userId) and s.status = :status")
    long countByUserIdAndStatus(@Param("userId") Long userId, @Param("status") SessionStatus status);
}
