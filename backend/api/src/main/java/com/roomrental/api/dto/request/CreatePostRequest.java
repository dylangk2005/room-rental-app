package com.roomrental.api.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreatePostRequest {
    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
    private String title;

    @NotBlank(message = "Mô tả không được để trống")
    private String description;

    @NotBlank(message = "Địa chỉ không được để trống")
    private String address;

    @NotBlank(message = "Tỉnh/Thành phố không được để trống")
    private String province;

    @NotBlank(message = "Quận/Huyện không được để trống")
    private String district;

    @NotNull(message = "Diện tích không được để trống")
    @DecimalMin(value = "1.0", message = "Diện tích tối thiểu 1 m²")
    private BigDecimal area;

    @NotNull(message = "Giá thuê không được để trống")
    @DecimalMin(value = "1000", message = "Giá thuê tối thiểu 1000 VND")
    private BigDecimal rentalPrice;

    @NotNull(message = "Loại tin không được để trống")
    private Integer postTypeId;

    @NotNull(message = "Số ngày đăng tin không được để trống")
    @Min(value = 5, message = "Số ngày đăng tin tối thiểu 5 ngày")
    private Integer durationDays; // 5, 10, 15, 30
}
