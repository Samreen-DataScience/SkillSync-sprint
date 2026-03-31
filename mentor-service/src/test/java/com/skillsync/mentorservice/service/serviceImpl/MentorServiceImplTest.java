package com.skillsync.mentorservice.service.serviceImpl;

import com.skillsync.mentorservice.config.RabbitConfig;
import com.skillsync.mentorservice.dto.AvailabilitySlotDto;
import com.skillsync.mentorservice.dto.MentorApplyRequest;
import com.skillsync.mentorservice.dto.MentorAvailabilityRequest;
import com.skillsync.mentorservice.dto.MentorResponse;
import com.skillsync.mentorservice.dto.PageResponse;
import com.skillsync.mentorservice.entity.MentorProfile;
import com.skillsync.mentorservice.entity.MentorStatus;
import com.skillsync.mentorservice.repository.MentorProfileRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.modelmapper.ModelMapper;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MentorServiceImplTest {

    @Mock
    private MentorProfileRepository mentorProfileRepository;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private MentorServiceImpl mentorService;

    @Test
    void applyShouldCreatePendingMentorProfile() {
        MentorApplyRequest request = new MentorApplyRequest();
        request.setUserId(3L);
        request.setBio("Java mentor");
        request.setExperienceYears(5);
        request.setHourlyRate(BigDecimal.valueOf(500));
        request.setSkillIds(Set.of(1L, 2L));

        MentorProfile unsaved = MentorProfile.builder().userId(3L).bio("Java mentor").experienceYears(5)
                .hourlyRate(BigDecimal.valueOf(500)).skillIds(Set.of(1L, 2L)).availabilitySlots(new ArrayList<>()).build();
        MentorProfile saved = MentorProfile.builder().id(10L).userId(3L).bio("Java mentor").experienceYears(5)
                .hourlyRate(BigDecimal.valueOf(500)).status(MentorStatus.PENDING).skillIds(Set.of(1L, 2L))
                .availabilitySlots(new ArrayList<>()).build();
        MentorResponse mapped = new MentorResponse();
        mapped.setId(10L);

        when(mentorProfileRepository.existsByUserId(3L)).thenReturn(false);
        when(modelMapper.map(request, MentorProfile.class)).thenReturn(unsaved);
        when(mentorProfileRepository.save(unsaved)).thenReturn(saved);
        when(modelMapper.map(saved, MentorResponse.class)).thenReturn(mapped);

        MentorResponse response = mentorService.apply(request);

        assertEquals(10L, response.getId());
        assertEquals("PENDING", response.getStatus());
    }

    @Test
    void getByIdShouldReturnMappedMentor() {
        MentorProfile profile = baseProfile(4L, MentorStatus.APPROVED);
        MentorResponse mapped = new MentorResponse();
        mapped.setId(4L);

        when(mentorProfileRepository.findById(4L)).thenReturn(Optional.of(profile));
        when(modelMapper.map(profile, MentorResponse.class)).thenReturn(mapped);

        MentorResponse response = mentorService.getById(4L);

        assertEquals(4L, response.getId());
        assertEquals("APPROVED", response.getStatus());
    }

    @Test
    void getAllShouldReturnPagedMentors() {
        MentorProfile profile = baseProfile(5L, MentorStatus.APPROVED);
        MentorResponse mapped = new MentorResponse();
        mapped.setId(5L);

        when(mentorProfileRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(profile), PageRequest.of(0, 10), 1));
        when(modelMapper.map(profile, MentorResponse.class)).thenReturn(mapped);

        PageResponse<MentorResponse> response = mentorService.getAll("1", BigDecimal.valueOf(4.0), 3, BigDecimal.valueOf(1000), 0, 10, "id", "asc");

        assertEquals(1, response.getContent().size());
        assertEquals("APPROVED", response.getContent().get(0).getStatus());
    }

    @Test
    void updateAvailabilityShouldReplaceAvailabilitySlots() {
        MentorProfile profile = baseProfile(6L, MentorStatus.APPROVED);
        MentorAvailabilityRequest request = new MentorAvailabilityRequest();
        AvailabilitySlotDto slot = new AvailabilitySlotDto();
        slot.setDayOfWeek("MONDAY");
        slot.setStartTime("09:00");
        slot.setEndTime("10:00");
        slot.setAvailable(true);
        request.setSlots(List.of(slot));

        MentorResponse mapped = new MentorResponse();
        when(mentorProfileRepository.findById(6L)).thenReturn(Optional.of(profile));
        when(mentorProfileRepository.save(profile)).thenReturn(profile);
        when(modelMapper.map(profile, MentorResponse.class)).thenReturn(mapped);

        MentorResponse response = mentorService.updateAvailability(6L, request);

        assertEquals(1, response.getAvailabilitySlots().size());
        assertEquals("MONDAY", response.getAvailabilitySlots().get(0).getDayOfWeek());
        assertEquals("09:00", response.getAvailabilitySlots().get(0).getStartTime());
        assertEquals("APPROVED", response.getStatus());
    }

    @Test
    void approveShouldSetStatusApprovedAndPublishNotification() {
        MentorProfile profile = baseProfile(7L, MentorStatus.PENDING);
        MentorResponse mapped = new MentorResponse();
        mapped.setId(7L);

        when(mentorProfileRepository.findById(7L)).thenReturn(Optional.of(profile));
        when(mentorProfileRepository.save(profile)).thenReturn(profile);
        when(modelMapper.map(profile, MentorResponse.class)).thenReturn(mapped);

        MentorResponse response = mentorService.approve(7L);

        assertEquals("APPROVED", response.getStatus());
        verify(rabbitTemplate).convertAndSend(eq(RabbitConfig.EXCHANGE), eq(RabbitConfig.MENTOR_APPROVED_KEY), any(Object.class));
    }

    @Test
    void rejectShouldSetStatusRejectedAndPublishNotification() {
        MentorProfile profile = baseProfile(8L, MentorStatus.PENDING);
        MentorResponse mapped = new MentorResponse();
        mapped.setId(8L);

        when(mentorProfileRepository.findById(8L)).thenReturn(Optional.of(profile));
        when(mentorProfileRepository.save(profile)).thenReturn(profile);
        when(modelMapper.map(profile, MentorResponse.class)).thenReturn(mapped);

        MentorResponse response = mentorService.reject(8L, "Application rejected");

        assertEquals("REJECTED", response.getStatus());
        verify(rabbitTemplate).convertAndSend(eq(RabbitConfig.EXCHANGE), eq("mentor.rejected"), any(Object.class));
    }

    @Test
    void updateAverageRatingShouldPersistRating() {
        MentorProfile profile = baseProfile(9L, MentorStatus.APPROVED);
        MentorResponse mapped = new MentorResponse();
        mapped.setId(9L);

        when(mentorProfileRepository.findById(9L)).thenReturn(Optional.of(profile));
        when(mentorProfileRepository.save(profile)).thenReturn(profile);
        when(modelMapper.map(profile, MentorResponse.class)).thenReturn(mapped);

        MentorResponse response = mentorService.updateAverageRating(9L, BigDecimal.valueOf(4.7));

        assertEquals("APPROVED", response.getStatus());

        ArgumentCaptor<MentorProfile> captor = ArgumentCaptor.forClass(MentorProfile.class);
        verify(mentorProfileRepository).save(captor.capture());
        assertEquals(BigDecimal.valueOf(4.7), captor.getValue().getAverageRating());
    }

    private MentorProfile baseProfile(Long id, MentorStatus status) {
        return MentorProfile.builder()
                .id(id)
                .userId(100L + id)
                .bio("Mentor bio")
                .experienceYears(6)
                .hourlyRate(BigDecimal.valueOf(700))
                .averageRating(BigDecimal.valueOf(4.2))
                .status(status)
                .skillIds(Set.of(1L, 2L))
                .availabilitySlots(new ArrayList<>())
                .build();
    }
}
