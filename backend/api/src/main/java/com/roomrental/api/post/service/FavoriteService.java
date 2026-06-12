package com.roomrental.api.post.service;

import com.roomrental.api.post.dto.response.PostPageResponse;
import com.roomrental.api.post.entity.Post;

  
public interface FavoriteService {

    void addFavorite(Integer userId, Integer postId);

    void removeFavorite(Integer userId, Integer postId);

    PostPageResponse getMyFavorites(Integer userId, int page, int size);
}