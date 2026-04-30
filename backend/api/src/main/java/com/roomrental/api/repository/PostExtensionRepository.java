package com.roomrental.api.repository;

import com.roomrental.api.entity.PostExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PostExtensionRepository extends JpaRepository <PostExtension, Integer> {
   Page<PostExtension> findByPostId(Integer postId, Pageable pageable);
   Page<PostExtension> findByUserId(Integer userId, Pageable pageable);
}
