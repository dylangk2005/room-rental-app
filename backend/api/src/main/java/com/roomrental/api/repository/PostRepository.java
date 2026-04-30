package com.roomrental.api.repository;

import com.roomrental.api.entity.Post;
import com.roomrental.api.entity.Post.PostStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository <Post, Integer>{
    Page<Post> findByStatus(PostStatus status, Pageable pageable);
    Page<Post> findByUserIdAndStatus(Integer userId, PostStatus status, Pageable pageable);
    List<Post> findByStatusAndEndAtBefore(PostStatus status, LocalDateTime now);
}
