package com.skillsync.reviewservice.controller;

import com.skillsync.reviewservice.dto.PageResponse;
import com.skillsync.reviewservice.dto.RatingSummaryResponse;
import com.skillsync.reviewservice.dto.ReviewRequest;
import com.skillsync.reviewservice.dto.ReviewResponse;
import com.skillsync.reviewservice.service.ReviewService;
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
class ReviewControllerTest {

    @Mock
    private ReviewService reviewService;

    private ReviewController controller;

    @BeforeEach
    void setUp() {
        controller = new ReviewController(reviewService);
    }

    @Test
    void createReturnsCreated() {
        ReviewRequest req = new ReviewRequest();
        ReviewResponse res = new ReviewResponse();
        when(reviewService.create(req)).thenReturn(res);

        var response = controller.create(req);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(res, response.getBody());
    }

    @Test
    void getByMentorReturnsPage() {
        PageResponse<ReviewResponse> page = PageResponse.<ReviewResponse>builder().content(List.of()).build();
        when(reviewService.getByMentorId(1L, 0, 10, "createdAt", "desc")).thenReturn(page);

        var response = controller.getByMentor(1L, 0, 10, "createdAt", "desc");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(page, response.getBody());
    }

    @Test
    void getAverageReturnsSummary() {
        RatingSummaryResponse summary = new RatingSummaryResponse(1L, 4.5);
        when(reviewService.getAverageRating(1L)).thenReturn(summary);

        var response = controller.getAverage(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(summary, response.getBody());
    }
}
