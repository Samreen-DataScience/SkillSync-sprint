package com.skillsync.groupservice.repository;

import com.skillsync.groupservice.entity.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    boolean existsByGroupIdAndUserId(Long groupId, Long userId);
    Optional<GroupMember> findByGroupIdAndUserId(Long groupId, Long userId);
    long countByGroupId(Long groupId);
    List<GroupMember> findByGroupIdOrderByJoinedAtAsc(Long groupId);
}
