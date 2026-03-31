package com.skillsync.skillservice.service.serviceImpl;

import com.skillsync.skillservice.dto.PageResponse;
import com.skillsync.skillservice.dto.SkillRequest;
import com.skillsync.skillservice.dto.SkillResponse;
import com.skillsync.skillservice.entity.Skill;
import com.skillsync.skillservice.exception.DuplicateResourceException;
import com.skillsync.skillservice.repository.SkillRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.modelmapper.ModelMapper;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SkillServiceImplTest {

    @Mock
    private SkillRepository skillRepository;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private SkillServiceImpl skillService;

    @Test
    void createShouldSaveNewSkill() {
        SkillRequest request = new SkillRequest();
        request.setName("Spring Boot");
        request.setCategory("Backend");

        Skill unsaved = Skill.builder().name("Spring Boot").category("Backend").build();
        Skill saved = Skill.builder().id(1L).name("Spring Boot").category("Backend").build();
        SkillResponse mapped = new SkillResponse();
        mapped.setId(1L);
        mapped.setName("Spring Boot");

        when(skillRepository.existsByNameIgnoreCase("Spring Boot")).thenReturn(false);
        when(modelMapper.map(request, Skill.class)).thenReturn(unsaved);
        when(skillRepository.save(unsaved)).thenReturn(saved);
        when(modelMapper.map(saved, SkillResponse.class)).thenReturn(mapped);

        SkillResponse response = skillService.create(request);

        assertEquals(1L, response.getId());
        assertEquals("Spring Boot", response.getName());
    }

    @Test
    void createShouldThrowWhenSkillAlreadyExists() {
        SkillRequest request = new SkillRequest();
        request.setName("Java");

        when(skillRepository.existsByNameIgnoreCase("Java")).thenReturn(true);

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class, () -> skillService.create(request));

        assertEquals("Skill already exists", ex.getMessage());
    }

    @Test
    void getByIdShouldReturnMappedSkill() {
        Skill skill = Skill.builder().id(2L).name("Docker").category("DevOps").build();
        SkillResponse mapped = new SkillResponse();
        mapped.setId(2L);
        mapped.setCategory("DevOps");

        when(skillRepository.findById(2L)).thenReturn(Optional.of(skill));
        when(modelMapper.map(skill, SkillResponse.class)).thenReturn(mapped);

        SkillResponse response = skillService.getById(2L);

        assertEquals(2L, response.getId());
        assertEquals("DevOps", response.getCategory());
    }

    @Test
    void getAllShouldReturnPagedSkillResponses() {
        Skill skill = Skill.builder().id(3L).name("Redis").category("Cache").build();
        SkillResponse mapped = new SkillResponse();
        mapped.setId(3L);
        mapped.setName("Redis");

        when(skillRepository.findAll(PageRequest.of(0, 10, org.springframework.data.domain.Sort.by("id").ascending())))
                .thenReturn(new PageImpl<>(List.of(skill), PageRequest.of(0, 10), 1));
        when(modelMapper.map(skill, SkillResponse.class)).thenReturn(mapped);

        PageResponse<SkillResponse> response = skillService.getAll(0, 10, "id", "asc");

        assertEquals(1, response.getContent().size());
        assertEquals("Redis", response.getContent().get(0).getName());
    }
}
