package com.roomrental.api.post.repository;

import com.roomrental.api.post.entity.Favorite;
import com.roomrental.api.post.entity.Post;
import com.roomrental.api.pricing.entity.PostType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Favorite.FavoriteId> {

    @EntityGraph(attributePaths = {"post", "post.postType", "post.user"})
    Page<Favorite> findByUser_Id(Integer userId, Pageable pageable);

    @EntityGraph(attributePaths = {"post", "post.postType", "post.user"})
    Page<Favorite> findByUser_IdAndPost_Status(Integer userId, Post.PostStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"post", "post.postType", "post.user"})
    @Query("SELECT f FROM Favorite f WHERE f.user.id = :userId AND f.post.status = 'ACTIVE'")
    Page<Favorite> findByUser_IdAndActivePost(Integer userId, Pageable pageable);

    boolean existsByUser_IdAndPost_Id(Integer userId, Integer postId);

    void deleteByUser_IdAndPost_Id(Integer userId, Integer postId);
}