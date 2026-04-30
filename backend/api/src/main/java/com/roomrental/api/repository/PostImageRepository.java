package com.roomrental.api.repository;

import com.roomrental.api.entity.PostImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostImageRepository extends JpaRepository <PostImage, Integer> {
    List<PostImage> findByPostId(Integer postId);
    void deleteByPostId(Integer postId);
}
