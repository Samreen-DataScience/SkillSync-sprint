package com.skillsync.groupservice.controller;

import com.skillsync.groupservice.dto.GroupCreateRequest;
import com.skillsync.groupservice.dto.GroupMemberResponse;
import com.skillsync.groupservice.dto.GroupMessageRequest;
import com.skillsync.groupservice.dto.GroupMessageResponse;
import com.skillsync.groupservice.dto.GroupResponse;
import com.skillsync.groupservice.dto.PageResponse;
import com.skillsync.groupservice.service.GroupService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GroupControllerTest {

    @Mock
    private GroupService groupService;

    private GroupController controller;

    @BeforeEach
    void setUp() {
        controller = new GroupController(groupService);
    }

    @Test
    void createReturnsCreated() {
        GroupCreateRequest req = new GroupCreateRequest();
        GroupResponse res = new GroupResponse();
        when(groupService.create(req)).thenReturn(res);

        var response = controller.create(req);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(res, response.getBody());
    }

    @Test
    void joinAndLeaveReturnOk() {
        GroupResponse res = new GroupResponse();
        when(groupService.join(1L, 2L)).thenReturn(res);
        when(groupService.leave(1L, 2L)).thenReturn(res);

        var joinResponse = controller.join(1L, 2L);
        var leaveResponse = controller.leave(1L, 2L);

        assertEquals(HttpStatus.OK, joinResponse.getStatusCode());
        assertEquals(HttpStatus.OK, leaveResponse.getStatusCode());
    }

    @Test
    void getAllAndGetByIdReturnData() {
        PageResponse<GroupResponse> page = PageResponse.<GroupResponse>builder().content(List.of()).build();
        GroupResponse one = new GroupResponse();
        when(groupService.getAll(0, 10, "id", "asc")).thenReturn(page);
        when(groupService.getById(1L)).thenReturn(one);

        var allResponse = controller.getAll(0, 10, "id", "asc");
        var oneResponse = controller.getById(1L);

        assertEquals(HttpStatus.OK, allResponse.getStatusCode());
        assertEquals(page, allResponse.getBody());
        assertEquals(HttpStatus.OK, oneResponse.getStatusCode());
        assertEquals(one, oneResponse.getBody());
    }

    @Test
    void membersAndMessagesReturnData() {
        List<GroupMemberResponse> members = List.of(new GroupMemberResponse());
        GroupMessageRequest request = new GroupMessageRequest();
        GroupMessageResponse created = new GroupMessageResponse();
        PageResponse<GroupMessageResponse> page = PageResponse.<GroupMessageResponse>builder().content(List.of()).build();

        when(groupService.getMembers(1L)).thenReturn(members);
        when(groupService.addDiscussion(1L, request)).thenReturn(created);
        when(groupService.getDiscussions(1L, 0, 10, "createdAt", "desc")).thenReturn(page);

        var membersResponse = controller.getMembers(1L);
        var createMessageResponse = controller.addMessage(1L, request);
        var listMessagesResponse = controller.getMessages(1L, 0, 10, "createdAt", "desc");

        assertEquals(HttpStatus.OK, membersResponse.getStatusCode());
        assertEquals(members, membersResponse.getBody());
        assertEquals(HttpStatus.CREATED, createMessageResponse.getStatusCode());
        assertEquals(created, createMessageResponse.getBody());
        assertEquals(HttpStatus.OK, listMessagesResponse.getStatusCode());
        assertEquals(page, listMessagesResponse.getBody());
    }
}
