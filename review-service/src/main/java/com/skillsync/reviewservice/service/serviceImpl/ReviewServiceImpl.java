package com.skillsync.reviewservice.service.serviceImpl;

import com.skillsync.reviewservice.dto.*;
import com.skillsync.reviewservice.entity.Review;
import com.skillsync.reviewservice.exception.BusinessException;
import com.skillsync.reviewservice.feign.MentorClient;
import com.skillsync.reviewservice.repository.ReviewRepository;
import com.skillsync.reviewservice.service.ReviewService;
import org.modelmapper.ModelMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.client.circuitbreaker.CircuitBreakerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@Transactional
public class ReviewServiceImpl implements ReviewService {

    private static final Logger log = LoggerFactory.getLogger(ReviewServiceImpl.class);

    private final ReviewRepository reviewRepository;
    private final ModelMapper modelMapper;
    private final MentorClient mentorClient;
    private final CircuitBreakerFactory<?, ?> circuitBreakerFactory;

    public ReviewServiceImpl(
            ReviewRepository reviewRepository,
            ModelMapper modelMapper,
            MentorClient mentorClient,
            CircuitBreakerFactory<?, ?> circuitBreakerFactory
    ) {
        this.reviewRepository = reviewRepository;
        this.modelMapper = modelMapper;
        this.mentorClient = mentorClient;
        this.circuitBreakerFactory = circuitBreakerFactory;
    }

    @Override
    public ReviewResponse create(ReviewRequest request) {
        if (reviewRepository.existsBySessionIdAndUserId(request.getSessionId(), request.getUserId())) {
            throw new BusinessException("Review already exists for this session by this learner");
        }

        Review review = Review.builder()
                .mentorId(request.getMentorId())
                .userId(request.getUserId())
                .sessionId(request.getSessionId())
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Review saved = reviewRepository.save(review);

        Double average = reviewRepository.averageRatingByMentorId(request.getMentorId());
        BigDecimal averageRating = BigDecimal.valueOf(average == null ? 0.0 : average);

        circuitBreakerFactory.create("mentorRatingUpdate").run(
                () -> {
                    mentorClient.updateAverageRating(request.getMentorId(), new MentorRatingUpdateRequest(averageRating));
                    return null;
                },
                throwable -> {
                    log.warn("Mentor-service is unavailable. Skipping average rating update for mentorId={}", request.getMentorId());
                    return null;
                }
        );

        return modelMapper.map(saved, ReviewResponse.class);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getByMentorId(Long mentorId, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Page<Review> result = reviewRepository.findByMentorId(mentorId, PageRequest.of(page, size, sort));
        return PageResponse.<ReviewResponse>builder()
                .content(result.getContent().stream().map(r -> modelMapper.map(r, ReviewResponse.class)).toList())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public RatingSummaryResponse getAverageRating(Long mentorId) {
        return new RatingSummaryResponse(mentorId, reviewRepository.averageRatingByMentorId(mentorId));
    }
}
