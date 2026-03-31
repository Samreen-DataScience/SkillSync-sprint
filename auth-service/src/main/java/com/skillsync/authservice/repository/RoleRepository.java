package com.skillsync.authservice.repository;

import com.skillsync.authservice.entity.Role;
import com.skillsync.authservice.entity.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleName name);
}
