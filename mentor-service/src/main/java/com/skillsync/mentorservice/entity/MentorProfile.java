package com.skillsync.mentorservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "mentor_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentorProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(length = 100)
    private String displayName;

    @Column(length = 150)
    private String email;

    @Column(length = 2000)
    private String bio;

    @Column(nullable = false)
    private Integer experienceYears;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    @Column(nullable = false, precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal averageRating = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MentorStatus status = MentorStatus.PENDING;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "mentor_skills", joinColumns = @JoinColumn(name = "mentor_id"))
    @Column(name = "skill_id")
    @Builder.Default
    private Set<Long> skillIds = new HashSet<>();

    @OneToMany(mappedBy = "mentor", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MentorAvailabilitySlot> availabilitySlots = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
