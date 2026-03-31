package com.skillsync.userservice.service.serviceImpl;

import com.skillsync.userservice.dto.PageResponse;
import com.skillsync.userservice.dto.UserProfileRequest;
import com.skillsync.userservice.dto.UserProfileResponse;
import com.skillsync.userservice.entity.UserProfile;
import com.skillsync.userservice.exception.DuplicateResourceException;
import com.skillsync.userservice.repository.UserProfileRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.modelmapper.ModelMapper;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceImplTest {

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private UserProfileServiceImpl userProfileService;

    @Test
    void createShouldSaveNewProfile() {
        UserProfileRequest request = buildRequest();
        UserProfile unsaved = UserProfile.builder().authUserId(1L).fullName("Learner User").email("learner@test.com").skills(Set.of("Java")).build();
        UserProfile saved = UserProfile.builder().id(5L).authUserId(1L).fullName("Learner User").email("learner@test.com").skills(Set.of("Java")).build();
        UserProfileResponse mapped = new UserProfileResponse();
        mapped.setId(5L);
        mapped.setFullName("Learner User");

        when(userProfileRepository.existsByEmail("learner@test.com")).thenReturn(false);
        when(userProfileRepository.existsByAuthUserId(1L)).thenReturn(false);
        when(modelMapper.map(request, UserProfile.class)).thenReturn(unsaved);
        when(userProfileRepository.save(unsaved)).thenReturn(saved);
        when(modelMapper.map(saved, UserProfileResponse.class)).thenReturn(mapped);

        UserProfileResponse response = userProfileService.create(request);

        assertEquals(5L, response.getId());
        assertEquals("Learner User", response.getFullName());
    }

    @Test
    void createShouldThrowWhenEmailExists() {
        UserProfileRequest request = buildRequest();
        when(userProfileRepository.existsByEmail("learner@test.com")).thenReturn(true);

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class, () -> userProfileService.create(request));

        assertEquals("Email already exists", ex.getMessage());
    }

    @Test
    void updateShouldModifyExistingProfile() {
        UserProfile existing = UserProfile.builder().id(7L).authUserId(1L).fullName("Old Name").email("old@test.com").skills(Set.of("Java")).build();
        UserProfileRequest request = buildRequest();
        request.setFullName("Updated User");
        request.setEmail("updated@test.com");
        UserProfile saved = UserProfile.builder().id(7L).authUserId(1L).fullName("Updated User").email("updated@test.com").skills(Set.of("Spring")).build();
        UserProfileResponse mapped = new UserProfileResponse();
        mapped.setId(7L);
        mapped.setFullName("Updated User");

        when(userProfileRepository.findById(7L)).thenReturn(Optional.of(existing));
        when(userProfileRepository.save(existing)).thenReturn(saved);
        when(modelMapper.map(saved, UserProfileResponse.class)).thenReturn(mapped);

        UserProfileResponse response = userProfileService.update(7L, request);

        assertEquals("Updated User", response.getFullName());
        ArgumentCaptor<UserProfile> captor = ArgumentCaptor.forClass(UserProfile.class);
        verify(userProfileRepository).save(captor.capture());
        assertEquals("updated@test.com", captor.getValue().getEmail());
    }

    @Test
    void getByIdShouldReturnMappedProfile() {
        UserProfile profile = UserProfile.builder().id(8L).authUserId(2L).fullName("Mentor User").email("mentor@test.com").build();
        UserProfileResponse mapped = new UserProfileResponse();
        mapped.setId(8L);
        mapped.setEmail("mentor@test.com");

        when(userProfileRepository.findById(8L)).thenReturn(Optional.of(profile));
        when(modelMapper.map(profile, UserProfileResponse.class)).thenReturn(mapped);

        UserProfileResponse response = userProfileService.getById(8L);

        assertEquals(8L, response.getId());
        assertEquals("mentor@test.com", response.getEmail());
    }

    @Test
    void getAllShouldReturnPagedProfiles() {
        UserProfile profile = UserProfile.builder().id(9L).authUserId(3L).fullName("Admin User").email("admin@test.com").build();
        UserProfileResponse mapped = new UserProfileResponse();
        mapped.setId(9L);
        mapped.setFullName("Admin User");

        when(userProfileRepository.findAll(PageRequest.of(0, 10, org.springframework.data.domain.Sort.by("id").ascending())))
                .thenReturn(new PageImpl<>(List.of(profile), PageRequest.of(0, 10), 1));
        when(modelMapper.map(profile, UserProfileResponse.class)).thenReturn(mapped);

        PageResponse<UserProfileResponse> response = userProfileService.getAll(0, 10, "id", "asc");

        assertEquals(1, response.getContent().size());
        assertEquals("Admin User", response.getContent().get(0).getFullName());
    }

    private UserProfileRequest buildRequest() {
        UserProfileRequest request = new UserProfileRequest();
        request.setAuthUserId(1L);
        request.setFullName("Learner User");
        request.setEmail("learner@test.com");
        request.setBio("Bio");
        request.setProfessionalTitle("Student");
        request.setProfileImageUrl("image.png");
        request.setSkills(Set.of("Spring"));
        return request;
    }
}
