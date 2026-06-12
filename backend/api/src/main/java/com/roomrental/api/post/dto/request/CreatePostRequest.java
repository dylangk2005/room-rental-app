package com.roomrental.api.post.dto.request;

import com.roomrental.api.post.entity.Post;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class CreatePostRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 255, message = "Tiêu đề tối đa 255 ký tự")
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
    @DecimalMin(value = "1.0", message = "Diện tích tối thiểu 1 m²")
    private BigDecimal area;

    @NotNull(message = "Giá thuê không được để trống")
    @DecimalMin(value = "1000", message = "Giá thuê tối thiểu 1,000đ")
    private BigDecimal rentalPrice;

    @NotNull(message = "Loại tin không được để trống")
    private Integer postTypeId;

    @NotNull(message = "Số ngày đăng không được để trống")
    @Min(value = 1, message = "Số ngày đăng tối thiểu 1 ngày")
    private Integer durationDays;
}