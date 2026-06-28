package com.roomrental.api.pricing.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.roomrental.api.common.util.RedisCacheService;
import com.roomrental.api.pricing.dto.response.PostTypePriceResponse;
import com.roomrental.api.pricing.dto.response.PostTypeResponse;
import com.roomrental.api.pricing.entity.PostType;
import com.roomrental.api.pricing.entity.PostTypePrice;
import com.roomrental.api.pricing.repository.PostTypePriceRepository;
import com.roomrental.api.pricing.repository.PostTypeRepository;
import com.roomrental.api.pricing.service.PostTypeService;
import java.time.Duration;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PostTypeServiceImpl implements PostTypeService {

    private static final String POST_TYPES_CACHE_KEY = "cache:post-types";
    private static final Duration POST_TYPES_CACHE_TTL = Duration.ofMinutes(15);

    private final PostTypeRepository postTypeRepository;
    private final PostTypePriceRepository postTypePriceRepository;
    private final RedisCacheService redisCacheService;

    @Override
    public List<PostTypeResponse> getPostTypes() {
        return redisCacheService.get(POST_TYPES_CACHE_KEY, new TypeReference<List<PostTypeResponse>>() {
                })
                .orElseGet(() -> {
                    List<PostTypeResponse> result = postTypeRepository.findAllByOrderByPriorityAsc()
                .stream()
                .map(this::mapPostType)
                .toList();
                    redisCacheService.set(POST_TYPES_CACHE_KEY, result, POST_TYPES_CACHE_TTL);
                    return result;
                });
    }

    private PostTypeResponse mapPostType(PostType postType) {
        List<PostTypePriceResponse> prices = postTypePriceRepository.findByPostType_IdOrderById_DayAsc(postType.getId())
                .stream()
                .map(this::mapPrice)
                .toList();

        return PostTypeResponse.builder()
                .id(postType.getId())
                .name(postType.getName())
                .titleColor(postType.getTitleColor())
                .titleSize(postType.getTitleSize())
                .priority(postType.getPriority())
                .pushPrice(postType.getPushPrice())
                .isUppercase(Boolean.TRUE.equals(postType.getIsUppercase()))
                .hasRecommendTag(Boolean.TRUE.equals(postType.getHasRecommendTag()))
                .maxImageLimit(postType.getMaxImageLimit())
                .prices(prices)
                .build();
    }

    private PostTypePriceResponse mapPrice(PostTypePrice price) {
        return PostTypePriceResponse.builder()
                .days(price.getId().getDay())
                .price(price.getPrice())
                .build();
    }
}
