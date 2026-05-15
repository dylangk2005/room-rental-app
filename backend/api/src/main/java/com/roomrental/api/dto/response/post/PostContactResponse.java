package com.roomrental.api.dto.response.post;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PostContactResponse {
    private Integer ownerId;
    private String ownerName;
    private String ownerPhone;
}