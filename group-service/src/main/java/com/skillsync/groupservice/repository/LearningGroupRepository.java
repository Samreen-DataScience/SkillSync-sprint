package com.skillsync.groupservice.repository;

import com.skillsync.groupservice.entity.LearningGroup;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LearningGroupRepository extends JpaRepository<LearningGroup, Long> {
}
