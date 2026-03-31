package com.skillsync.reviewservice.repository;

import com.skillsync.reviewservice.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    Page<Review> findByMentorId(Long mentorId, Pageable pageable);
    boolean existsBySessionIdAndUserId(Long sessionId, Long userId);

    @Query("select coalesce(avg(r.rating), 0) from Review r where r.mentorId = :mentorId")
    Double averageRatingByMentorId(@Param("mentorId") Long mentorId);
}
