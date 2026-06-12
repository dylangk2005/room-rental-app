package com.roomrental.api.moderation.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateReportRequest {

    @NotNull(message = "Vui lòng chọn tin đăng cần báo cáo")
    private Integer postId;

    @NotBlank(message = "Vui lòng nhập lý do báo cáo")
    private String reason;

    private String description;
}