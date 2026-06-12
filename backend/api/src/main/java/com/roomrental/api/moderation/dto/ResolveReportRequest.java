package com.roomrental.api.moderation.dto;

import com.roomrental.api.moderation.entity.Report;
import com.roomrental.api.post.entity.Post.PostStatus;
import com.roomrental.api.post.entity.Post;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ResolveReportRequest {

    @NotNull(message = "Vui lòng chọn kết quả xử lý")
    private Report.ReportStatus decision;

    private String resolutionNote;

    private Post.PostStatus postAction;
}