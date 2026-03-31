package com.skillsync.groupservice.service;

import com.skillsync.groupservice.dto.*;

import java.util.List;

public interface GroupService {
    GroupResponse create(GroupCreateRequest request);
    GroupResponse join(Long groupId, Long userId);
    GroupResponse leave(Long groupId, Long userId);
    PageResponse<GroupResponse> getAll(int page, int size, String sortBy, String sortDir);
    GroupResponse getById(Long id);
    List<GroupMemberResponse> getMembers(Long groupId);
    GroupMessageResponse addDiscussion(Long groupId, GroupMessageRequest request);
    PageResponse<GroupMessageResponse> getDiscussions(Long groupId, int page, int size, String sortBy, String sortDir);
}
