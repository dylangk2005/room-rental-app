package com.roomrental.api.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.roomrental.api.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryServiceImpl implements CloudinaryService {
    private final Cloudinary cloudinary;

    public String uploadImage(MultipartFile file){
        try{
            Map result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap("folder", "roomrental/posts")
            );
            return (String) result.get("secure_url");
        }
        catch(IOException e){
            throw new RuntimeException("Không thể upload ảnh" + e.getMessage());
        }
    }

    public void deleteImage(String imageUrl){
        try{
            // Lấy public_id từ URL
            String publicId = extractPublicId(imageUrl);
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (IOException e) {
            throw new RuntimeException("Không thể xóa ảnh" + e.getMessage());
        }
    }

    private String extractPublicId(String imageUrl){
        // URL dạng: https://res.cloudinary.com/{cloud}/image/upload/v123/roomrental/posts/image.jpg
        String[] parts = imageUrl.split("/upload/");
        String afterUpload = parts[1]; // v123/roomrental/posts/image.jpg
        // Bỏ version prefix nếu có
        String withoutVersion = afterUpload.replaceFirst("v\\d+/", ""); // roomrental/posts/image.jpg
        // Bỏ phần mở rộng
        return withoutVersion.substring(0, withoutVersion.lastIndexOf('.'));
    }
}
