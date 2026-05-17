package com.roomrental.api.dto.request.report;

import com.roomrental.api.entity.Post;
import com.roomrental.api.entity.Report;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ResolveReportRequest {

    @NotNull(message = "Vui lòng chọn kết quả xử lý")
    private Report.ReportStatus decision;

    private String resolutionNote;

    private Post.PostStatus postAction;
}