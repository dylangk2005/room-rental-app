package com.roomrental.api.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class BoostPostResponse {
    private Integer postId;
    private LocalDateTime pushTime;
}