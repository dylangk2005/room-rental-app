package com.roomrental.api.repository;

import com.roomrental.api.entity.Favorite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Favorite.FavoriteId> {

    @EntityGraph(attributePaths = {"post", "post.postType"})
    Page<Favorite> findByUser_Id(Integer userId, Pageable pageable);

    boolean existsByUser_IdAndPost_Id(Integer userId, Integer postId);

    void deleteByUser_IdAndPost_Id(Integer userId, Integer postId);
}