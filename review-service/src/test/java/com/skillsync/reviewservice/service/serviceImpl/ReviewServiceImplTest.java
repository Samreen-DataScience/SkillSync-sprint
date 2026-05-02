package com.skillsync.reviewservice.service.serviceImpl;

import com.skillsync.reviewservice.dto.MentorRatingUpdateRequest;
import com.skillsync.reviewservice.dto.PageResponse;
import com.skillsync.reviewservice.dto.RatingSummaryResponse;
import com.skillsync.reviewservice.dto.ReviewRequest;
import com.skillsync.reviewservice.dto.ReviewResponse;
import com.skillsync.reviewservice.entity.Review;
import com.skillsync.reviewservice.exception.BusinessException;
import com.skillsync.reviewservice.feign.MentorClient;
import com.skillsync.reviewservice.repository.ReviewRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.modelmapper.ModelMapper;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.cloud.client.circuitbreaker.CircuitBreaker;
import org.springframework.cloud.client.circuitbreaker.CircuitBreakerFactory;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.List;
import java.util.function.Function;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewServiceImplTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private MentorClient mentorClient;

    @Mock
    private CircuitBreakerFactory circuitBreakerFactory;

    @Mock
    private CircuitBreaker circuitBreaker;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private ReviewServiceImpl reviewService;

    @Test
    void createShouldSaveReviewAndUpdateMentorRating() {
        ReviewRequest request = buildRequest();
        Review saved = Review.builder().id(11L).mentorId(1L).userId(2L).sessionId(3L).rating(5).comment("Great").build();
        ReviewResponse mapped = new ReviewResponse();
        mapped.setId(11L);

        when(reviewRepository.existsBySessionIdAndUserId(3L, 2L)).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenReturn(saved);
        when(reviewRepository.averageRatingByMentorId(1L)).thenReturn(4.5);
        when(circuitBreakerFactory.create("mentorRatingUpdate")).thenReturn(circuitBreaker);
        when(modelMapper.map(saved, ReviewResponse.class)).thenReturn(mapped);
        when(circuitBreaker.run(any(Supplier.class), any(Function.class))).thenAnswer(invocation -> {
            Supplier<?> supplier = invocation.getArgument(0);
            return supplier.get();
        });

        ReviewResponse response = reviewService.create(request);

        assertEquals(11L, response.getId());
        ArgumentCaptor<MentorRatingUpdateRequest> captor = ArgumentCaptor.forClass(MentorRatingUpdateRequest.class);
        verify(mentorClient).updateAverageRating(eq(1L), captor.capture());
        assertEquals(BigDecimal.valueOf(4.5), captor.getValue().getAverageRating());
    }

    @Test
    void createShouldThrowWhenReviewAlreadyExists() {
        ReviewRequest request = buildRequest();
        when(reviewRepository.existsBySessionIdAndUserId(3L, 2L)).thenReturn(true);

        BusinessException ex = assertThrows(BusinessException.class, () -> reviewService.create(request));

        assertEquals("Review already exists for this session by this learner", ex.getMessage());
    }

    @Test
    void createShouldSaveReviewEvenWhenMentorServiceIsUnavailable() {
        ReviewRequest request = buildRequest();
        Review saved = Review.builder().id(12L).mentorId(1L).userId(2L).sessionId(3L).rating(5).comment("Great").build();
        ReviewResponse mapped = new ReviewResponse();
        mapped.setId(12L);

        when(reviewRepository.existsBySessionIdAndUserId(3L, 2L)).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenReturn(saved);
        when(reviewRepository.averageRatingByMentorId(1L)).thenReturn(4.5);
        when(circuitBreakerFactory.create("mentorRatingUpdate")).thenReturn(circuitBreaker);
        when(modelMapper.map(saved, ReviewResponse.class)).thenReturn(mapped);
        doThrow(new RuntimeException("mentor-service down")).when(mentorClient)
                .updateAverageRating(eq(1L), any(MentorRatingUpdateRequest.class));
        when(circuitBreaker.run(any(Supplier.class), any(Function.class))).thenAnswer(invocation -> {
            Supplier<?> supplier = invocation.getArgument(0);
            Function<Throwable, ?> fallback = invocation.getArgument(1);
            try {
                return supplier.get();
            } catch (Throwable throwable) {
                return fallback.apply(throwable);
            }
        });

        ReviewResponse response = reviewService.create(request);

        assertEquals(12L, response.getId());
        verify(reviewRepository).save(any(Review.class));
    }

    @Test
    void getByMentorIdShouldReturnPagedReviews() {
        Review review = Review.builder().id(30L).mentorId(1L).userId(2L).sessionId(3L).rating(4).comment("Nice").build();
        ReviewResponse mapped = new ReviewResponse();
        mapped.setId(30L);
        mapped.setRating(4);

        when(reviewRepository.findByMentorId(eq(1L), any()))
                .thenReturn(new PageImpl<>(List.of(review), PageRequest.of(0, 10), 1));
        when(modelMapper.map(review, ReviewResponse.class)).thenReturn(mapped);

        PageResponse<ReviewResponse> response = reviewService.getByMentorId(1L, 0, 10, "id", "asc");

        assertEquals(1, response.getContent().size());
        assertEquals(4, response.getContent().get(0).getRating());
    }

    @Test
    void getAverageRatingShouldReturnSummary() {
        when(reviewRepository.averageRatingByMentorId(5L)).thenReturn(4.8);

        RatingSummaryResponse response = reviewService.getAverageRating(5L);

        assertEquals(5L, response.getMentorId());
        assertEquals(4.8, response.getAverageRating());
    }

    private ReviewRequest buildRequest() {
        ReviewRequest request = new ReviewRequest();
        request.setMentorId(1L);
        request.setUserId(2L);
        request.setSessionId(3L);
        request.setRating(5);
        request.setComment("Great");
        return request;
    }
}
