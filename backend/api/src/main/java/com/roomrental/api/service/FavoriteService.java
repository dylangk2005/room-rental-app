package com.roomrental.api.service;

import com.roomrental.api.dto.response.post.PostPageResponse;

public interface FavoriteService {

    void addFavorite(Integer userId, Integer postId);

    void removeFavorite(Integer userId, Integer postId);

    PostPageResponse getMyFavorites(Integer userId, int page, int size);
}