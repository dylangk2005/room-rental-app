package com.roomrental.api.post.dto.response;

import com.roomrental.api.post.entity.Post;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PostContactResponse {
    private Integer ownerId;
    private String ownerName;
    private String ownerPhone;
    private String ownerAvatar;
}