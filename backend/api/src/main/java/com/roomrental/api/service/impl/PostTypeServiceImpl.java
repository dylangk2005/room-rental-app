package com.roomrental.api.service.impl;

import com.roomrental.api.dto.response.posttype.PostTypePriceResponse;
import com.roomrental.api.dto.response.posttype.PostTypeResponse;
import com.roomrental.api.entity.PostType;
import com.roomrental.api.entity.PostTypePrice;
import com.roomrental.api.repository.PostTypePriceRepository;
import com.roomrental.api.repository.PostTypeRepository;
import com.roomrental.api.service.PostTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PostTypeServiceImpl implements PostTypeService {

    private final PostTypeRepository postTypeRepository;
    private final PostTypePriceRepository postTypePriceRepository;

    @Override
    public List<PostTypeResponse> getPostTypes() {
        return postTypeRepository.findAllByOrderByPriorityAsc()
                .stream()
                .map(this::mapPostType)
                .toList();
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
