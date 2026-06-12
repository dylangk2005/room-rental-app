package com.roomrental.api.post.dto;

import com.roomrental.api.post.entity.Post;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PostLocationResponse {
    private String province;
    private List<String> districts;
}