package com.roomrental.api.dto.request.post;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class UpdatePostRequest {

        @NotBlank(message = "Tiêu đề không được để trống")
        @Size(max = 255)
        private String title;

        @NotBlank(message = "Mô tả không được để trống")
        private String description;

        @NotBlank(message = "Địa chỉ không được để trống")
        private String address;

        @NotBlank(message = "Tỉnh/thành không được để trống")
        private String province;

        @NotBlank(message = "Quận/huyện không được để trống")
        private String district;

        @NotNull(message = "Diện tích không được để trống")
        @DecimalMin("1.0")
        private BigDecimal area;

        @NotNull(message = "Giá thuê không được để trống")
        @DecimalMin("1000")
        private BigDecimal rentalPrice;

        // Danh sách URL ảnh muốn xóa (có thể null)
        private List<String> deleteImageUrls;
}