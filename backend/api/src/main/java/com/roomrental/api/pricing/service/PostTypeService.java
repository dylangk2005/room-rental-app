package com.roomrental.api.pricing.service;

import com.roomrental.api.pricing.dto.response.PostTypeResponse;
import java.util.List;

public interface PostTypeService {
    List<PostTypeResponse> getPostTypes();
}