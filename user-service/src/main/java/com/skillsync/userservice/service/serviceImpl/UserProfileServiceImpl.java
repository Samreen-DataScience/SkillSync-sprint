package com.skillsync.userservice.service.serviceImpl;

import com.skillsync.userservice.dto.PageResponse;
import com.skillsync.userservice.dto.UserProfileRequest;
import com.skillsync.userservice.dto.UserProfileResponse;
import com.skillsync.userservice.entity.UserProfile;
import com.skillsync.userservice.exception.DuplicateResourceException;
import com.skillsync.userservice.exception.ResourceNotFoundException;
import com.skillsync.userservice.repository.UserProfileRepository;
import com.skillsync.userservice.service.UserProfileService;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserProfileServiceImpl implements UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final ModelMapper modelMapper;

    public UserProfileServiceImpl(UserProfileRepository userProfileRepository, ModelMapper modelMapper) {
        this.userProfileRepository = userProfileRepository;
        this.modelMapper = modelMapper;
    }

    @Override
    public UserProfileResponse create(UserProfileRequest request) {
        if (userProfileRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already exists");
        }
        if (userProfileRepository.existsByAuthUserId(request.getAuthUserId())) {
            throw new DuplicateResourceException("Profile already exists for this user");
        }
        UserProfile saved = userProfileRepository.save(modelMapper.map(request, UserProfile.class));
        return modelMapper.map(saved, UserProfileResponse.class);
    }

    @Override
    public UserProfileResponse update(Long id, UserProfileRequest request) {
        UserProfile profile = userProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        profile.setFullName(request.getFullName());
        profile.setEmail(request.getEmail());
        profile.setBio(request.getBio());
        profile.setProfessionalTitle(request.getProfessionalTitle());
        profile.setProfileImageUrl(request.getProfileImageUrl());
        profile.setSkills(request.getSkills());

        return modelMapper.map(userProfileRepository.save(profile), UserProfileResponse.class);
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getById(Long id) {
        UserProfile profile = userProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));
        return modelMapper.map(profile, UserProfileResponse.class);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserProfileResponse> getAll(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Page<UserProfile> result = userProfileRepository.findAll(PageRequest.of(page, size, sort));
        return PageResponse.<UserProfileResponse>builder()
                .content(result.getContent().stream().map(p -> modelMapper.map(p, UserProfileResponse.class)).toList())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }
}
