package com.skillsync.groupservice.service.serviceImpl;

import com.skillsync.groupservice.dto.*;
import com.skillsync.groupservice.entity.GroupMember;
import com.skillsync.groupservice.entity.GroupMessage;
import com.skillsync.groupservice.entity.LearningGroup;
import com.skillsync.groupservice.exception.BusinessException;
import com.skillsync.groupservice.exception.ResourceNotFoundException;
import com.skillsync.groupservice.repository.GroupMemberRepository;
import com.skillsync.groupservice.repository.GroupMessageRepository;
import com.skillsync.groupservice.repository.LearningGroupRepository;
import com.skillsync.groupservice.service.GroupService;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class GroupServiceImpl implements GroupService {

    private final LearningGroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final GroupMessageRepository messageRepository;
    private final ModelMapper modelMapper;

    public GroupServiceImpl(LearningGroupRepository groupRepository, GroupMemberRepository memberRepository, GroupMessageRepository messageRepository, ModelMapper modelMapper) {
        this.groupRepository = groupRepository;
        this.memberRepository = memberRepository;
        this.messageRepository = messageRepository;
        this.modelMapper = modelMapper;
    }

    @Override
    public GroupResponse create(GroupCreateRequest request) {
        LearningGroup group = groupRepository.save(modelMapper.map(request, LearningGroup.class));
        memberRepository.save(GroupMember.builder().groupId(group.getId()).userId(request.getCreatedBy()).build());
        return toGroupResponse(group);
    }

    @Override
    public GroupResponse join(Long groupId, Long userId) {
        LearningGroup group = getGroup(groupId);
        if (memberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new BusinessException("User already joined this group");
        }
        memberRepository.save(GroupMember.builder().groupId(groupId).userId(userId).build());
        return toGroupResponse(group);
    }

    @Override
    public GroupResponse leave(Long groupId, Long userId) {
        LearningGroup group = getGroup(groupId);
        GroupMember member = memberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("User is not a member of this group"));
        memberRepository.delete(member);
        return toGroupResponse(group);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<GroupResponse> getAll(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Page<LearningGroup> result = groupRepository.findAll(PageRequest.of(page, size, sort));
        return PageResponse.<GroupResponse>builder()
                .content(result.getContent().stream().map(this::toGroupResponse).toList())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public GroupResponse getById(Long id) {
        return toGroupResponse(getGroup(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<GroupMemberResponse> getMembers(Long groupId) {
        getGroup(groupId);
        return memberRepository.findByGroupIdOrderByJoinedAtAsc(groupId).stream()
                .map(member -> modelMapper.map(member, GroupMemberResponse.class))
                .toList();
    }

    @Override
    public GroupMessageResponse addDiscussion(Long groupId, GroupMessageRequest request) {
        getGroup(groupId);
        if (!memberRepository.existsByGroupIdAndUserId(groupId, request.getUserId())) {
            throw new BusinessException("Only group members can post discussions");
        }
        GroupMessage message = GroupMessage.builder().groupId(groupId).userId(request.getUserId()).message(request.getMessage()).build();
        return modelMapper.map(messageRepository.save(message), GroupMessageResponse.class);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<GroupMessageResponse> getDiscussions(Long groupId, int page, int size, String sortBy, String sortDir) {
        getGroup(groupId);
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Page<GroupMessage> result = messageRepository.findByGroupId(groupId, PageRequest.of(page, size, sort));
        return PageResponse.<GroupMessageResponse>builder()
                .content(result.getContent().stream().map(m -> modelMapper.map(m, GroupMessageResponse.class)).toList())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }

    private LearningGroup getGroup(Long id) {
        return groupRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Group not found"));
    }

    private GroupResponse toGroupResponse(LearningGroup group) {
        GroupResponse response = modelMapper.map(group, GroupResponse.class);
        response.setMemberCount(memberRepository.countByGroupId(group.getId()));
        return response;
    }
}
