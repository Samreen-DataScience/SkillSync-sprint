package com.skillsync.groupservice.service.serviceImpl;

import com.skillsync.groupservice.dto.GroupCreateRequest;
import com.skillsync.groupservice.dto.GroupMessageRequest;
import com.skillsync.groupservice.dto.GroupMessageResponse;
import com.skillsync.groupservice.dto.GroupResponse;
import com.skillsync.groupservice.dto.PageResponse;
import com.skillsync.groupservice.entity.GroupMember;
import com.skillsync.groupservice.entity.GroupMessage;
import com.skillsync.groupservice.entity.LearningGroup;
import com.skillsync.groupservice.repository.GroupMemberRepository;
import com.skillsync.groupservice.repository.GroupMessageRepository;
import com.skillsync.groupservice.repository.LearningGroupRepository;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GroupServiceImplTest {

    @Mock
    private LearningGroupRepository groupRepository;

    @Mock
    private GroupMemberRepository memberRepository;

    @Mock
    private GroupMessageRepository messageRepository;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private GroupServiceImpl groupService;

    @Test
    void createShouldSaveGroupAndCreatorMembership() {
        GroupCreateRequest request = new GroupCreateRequest();
        request.setName("Backend Circle");
        request.setDescription("Discuss Spring");
        request.setCreatedBy(7L);

        LearningGroup unsaved = LearningGroup.builder().name("Backend Circle").description("Discuss Spring").createdBy(7L).build();
        LearningGroup saved = LearningGroup.builder().id(1L).name("Backend Circle").description("Discuss Spring").createdBy(7L).build();
        GroupResponse mapped = new GroupResponse();
        mapped.setId(1L);
        mapped.setName("Backend Circle");

        when(modelMapper.map(request, LearningGroup.class)).thenReturn(unsaved);
        when(groupRepository.save(unsaved)).thenReturn(saved);
        when(modelMapper.map(saved, GroupResponse.class)).thenReturn(mapped);
        when(memberRepository.countByGroupId(1L)).thenReturn(1L);

        GroupResponse response = groupService.create(request);

        assertEquals(1L, response.getId());
        assertEquals(1L, response.getMemberCount());

        ArgumentCaptor<GroupMember> memberCaptor = ArgumentCaptor.forClass(GroupMember.class);
        verify(memberRepository).save(memberCaptor.capture());
        assertEquals(1L, memberCaptor.getValue().getGroupId());
        assertEquals(7L, memberCaptor.getValue().getUserId());
    }

    @Test
    void joinShouldAddNewMemberToExistingGroup() {
        LearningGroup group = LearningGroup.builder().id(5L).name("Cloud Group").createdBy(1L).build();
        GroupResponse mapped = new GroupResponse();
        mapped.setId(5L);

        when(groupRepository.findById(5L)).thenReturn(Optional.of(group));
        when(memberRepository.existsByGroupIdAndUserId(5L, 9L)).thenReturn(false);
        when(modelMapper.map(group, GroupResponse.class)).thenReturn(mapped);
        when(memberRepository.countByGroupId(5L)).thenReturn(2L);

        GroupResponse response = groupService.join(5L, 9L);

        assertEquals(2L, response.getMemberCount());
        verify(memberRepository).save(any(GroupMember.class));
    }

    @Test
    void leaveShouldDeleteMemberAndReturnGroup() {
        LearningGroup group = LearningGroup.builder().id(3L).name("Java Group").build();
        GroupMember member = GroupMember.builder().id(11L).groupId(3L).userId(4L).build();
        GroupResponse mapped = new GroupResponse();
        mapped.setId(3L);

        when(groupRepository.findById(3L)).thenReturn(Optional.of(group));
        when(memberRepository.findByGroupIdAndUserId(3L, 4L)).thenReturn(Optional.of(member));
        when(modelMapper.map(group, GroupResponse.class)).thenReturn(mapped);
        when(memberRepository.countByGroupId(3L)).thenReturn(1L);

        GroupResponse response = groupService.leave(3L, 4L);

        assertEquals(1L, response.getMemberCount());
        verify(memberRepository).delete(member);
    }

    @Test
    void getAllShouldReturnPagedGroups() {
        LearningGroup group = LearningGroup.builder().id(2L).name("System Design").build();
        GroupResponse mapped = new GroupResponse();
        mapped.setId(2L);
        mapped.setName("System Design");

        when(groupRepository.findAll(PageRequest.of(0, 10, org.springframework.data.domain.Sort.by("id").ascending())))
                .thenReturn(new PageImpl<>(List.of(group), PageRequest.of(0, 10), 1));
        when(modelMapper.map(group, GroupResponse.class)).thenReturn(mapped);
        when(memberRepository.countByGroupId(2L)).thenReturn(5L);

        PageResponse<GroupResponse> response = groupService.getAll(0, 10, "id", "asc");

        assertEquals(1, response.getContent().size());
        assertEquals(5L, response.getContent().get(0).getMemberCount());
    }

    @Test
    void getByIdShouldReturnMappedGroup() {
        LearningGroup group = LearningGroup.builder().id(6L).name("DSA Group").build();
        GroupResponse mapped = new GroupResponse();
        mapped.setId(6L);

        when(groupRepository.findById(6L)).thenReturn(Optional.of(group));
        when(modelMapper.map(group, GroupResponse.class)).thenReturn(mapped);
        when(memberRepository.countByGroupId(6L)).thenReturn(8L);

        GroupResponse response = groupService.getById(6L);

        assertEquals(6L, response.getId());
        assertEquals(8L, response.getMemberCount());
    }

    @Test
    void addDiscussionShouldSaveMessageForMember() {
        LearningGroup group = LearningGroup.builder().id(4L).build();
        GroupMessageRequest request = new GroupMessageRequest();
        request.setUserId(12L);
        request.setMessage("Let's practice system design");

        GroupMessage saved = GroupMessage.builder().id(15L).groupId(4L).userId(12L).message("Let's practice system design").build();
        GroupMessageResponse mapped = new GroupMessageResponse();
        mapped.setId(15L);
        mapped.setMessage("Let's practice system design");

        when(groupRepository.findById(4L)).thenReturn(Optional.of(group));
        when(memberRepository.existsByGroupIdAndUserId(4L, 12L)).thenReturn(true);
        when(messageRepository.save(any(GroupMessage.class))).thenReturn(saved);
        when(modelMapper.map(saved, GroupMessageResponse.class)).thenReturn(mapped);

        GroupMessageResponse response = groupService.addDiscussion(4L, request);

        assertEquals(15L, response.getId());
        assertEquals("Let's practice system design", response.getMessage());
    }

    @Test
    void getDiscussionsShouldReturnPagedMessages() {
        LearningGroup group = LearningGroup.builder().id(9L).build();
        GroupMessage message = GroupMessage.builder().id(20L).groupId(9L).userId(2L).message("Hello team").build();
        GroupMessageResponse mapped = new GroupMessageResponse();
        mapped.setId(20L);
        mapped.setMessage("Hello team");

        when(groupRepository.findById(9L)).thenReturn(Optional.of(group));
        when(messageRepository.findByGroupId(eq(9L), any()))
                .thenReturn(new PageImpl<>(List.of(message), PageRequest.of(0, 10), 1));
        when(modelMapper.map(message, GroupMessageResponse.class)).thenReturn(mapped);

        PageResponse<GroupMessageResponse> response = groupService.getDiscussions(9L, 0, 10, "id", "asc");

        assertEquals(1, response.getContent().size());
        assertEquals("Hello team", response.getContent().get(0).getMessage());
    }
}
