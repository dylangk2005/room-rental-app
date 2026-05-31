package com.roomrental.api.dto.response.post;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PostLocationResponse {
    private String province;
    private List<String> districts;
}
