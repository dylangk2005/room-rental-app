package com.roomrental.api.repository;

import com.roomrental.api.entity.PostImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostImageRepository extends JpaRepository <PostImage, Integer> {
    List<PostImage> findByPostId(Integer postId); // Lấy danh sách hình ảnh theo postId
    void deleteByPostId(Integer postId); // Xóa tất cả hình ảnh liên quan đến một postId (sử dụng khi xóa bài đăng)
}
