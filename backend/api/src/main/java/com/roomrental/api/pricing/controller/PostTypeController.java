package com.roomrental.api.pricing.controller;

import com.roomrental.api.common.dto.ApiResponse;
import com.roomrental.api.post.entity.Post;
import com.roomrental.api.pricing.dto.PostTypeResponse;
import com.roomrental.api.pricing.service.PostTypeService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/post-types")
@RequiredArgsConstructor
public class PostTypeController {

    private final PostTypeService postTypeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PostTypeResponse>>> getPostTypes() {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách loại tin thành công", postTypeService.getPostTypes()));
    }
}