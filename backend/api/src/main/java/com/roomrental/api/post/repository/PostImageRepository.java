package com.roomrental.api.post.repository;

import com.roomrental.api.post.entity.Post;
import com.roomrental.api.post.entity.PostImage;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PostImageRepository extends JpaRepository<PostImage, Integer> {

    List<PostImage> findByPostId(Integer postId);

    Optional<PostImage> findByImageUrl(String imageUrl);

    Optional<PostImage> findByPostIdAndImageUrl(Integer postId, String imageUrl);

    // Tìm ảnh đại diện cho mỗi bài đăng trong danh sách bài đăng
    @Query("""
        SELECT pi FROM PostImage pi
        WHERE pi.post.id IN :postIds
        AND pi.id IN (
            SELECT MIN(p.id) FROM PostImage p
            WHERE p.post.id IN :postIds
            GROUP BY p.post.id
        )
    """)
    List<PostImage> findThumbnailsByPostIdIn(@Param("postIds") List<Integer> postIds);

    @Query("""
        SELECT pi FROM PostImage pi
        WHERE pi.post.id IN :postIds
        ORDER BY pi.post.id ASC, pi.id ASC
    """)
    List<PostImage> findByPostIdInOrderByPostIdAndId(@Param("postIds") List<Integer> postIds);

    int countByPostId(Integer postId);
}