package com.skillsync.skillservice.service.serviceImpl;

import com.skillsync.skillservice.dto.PageResponse;
import com.skillsync.skillservice.dto.SkillRequest;
import com.skillsync.skillservice.dto.SkillResponse;
import com.skillsync.skillservice.entity.Skill;
import com.skillsync.skillservice.exception.DuplicateResourceException;
import com.skillsync.skillservice.exception.ResourceNotFoundException;
import com.skillsync.skillservice.repository.SkillRepository;
import com.skillsync.skillservice.service.SkillService;
import org.modelmapper.ModelMapper;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SkillServiceImpl implements SkillService {

    private final SkillRepository skillRepository;
    private final ModelMapper modelMapper;

    public SkillServiceImpl(SkillRepository skillRepository, ModelMapper modelMapper) {
        this.skillRepository = skillRepository;
        this.modelMapper = modelMapper;
    }

    @Override
    @CacheEvict(value = "skills", allEntries = true)
    public SkillResponse create(SkillRequest request) {
        if (skillRepository.existsByNameIgnoreCase(request.getName())) {
            throw new DuplicateResourceException("Skill already exists");
        }
        Skill saved = skillRepository.save(modelMapper.map(request, Skill.class));
        return modelMapper.map(saved, SkillResponse.class);
    }

    @Override
    @Transactional(readOnly = true)
    public SkillResponse getById(Long id) {
        Skill skill = skillRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Skill not found"));
        return modelMapper.map(skill, SkillResponse.class);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "skills", key = "#page + '-' + #size + '-' + #sortBy + '-' + #sortDir")
    public PageResponse<SkillResponse> getAll(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Page<Skill> result = skillRepository.findAll(PageRequest.of(page, size, sort));
        return PageResponse.<SkillResponse>builder()
                .content(result.getContent().stream().map(s -> modelMapper.map(s, SkillResponse.class)).toList())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }
}
