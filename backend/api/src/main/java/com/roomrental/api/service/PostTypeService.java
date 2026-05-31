package com.roomrental.api.service;

import com.roomrental.api.dto.response.posttype.PostTypeResponse;

import java.util.List;

public interface PostTypeService {
    List<PostTypeResponse> getPostTypes();
}
