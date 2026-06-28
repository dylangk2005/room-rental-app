package com.roomrental.api.moderation.service;

import com.roomrental.api.moderation.dto.request.CreateReportRequest;
import com.roomrental.api.moderation.dto.response.ReportDetailResponse;
import com.roomrental.api.moderation.dto.response.ReportPageResponse;
import com.roomrental.api.moderation.dto.request.ResolveReportRequest;
import com.roomrental.api.moderation.entity.Report;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface ReportService {

    ReportDetailResponse createReport( // Tạo báo cáo mới
                                       Integer userId,
                                       CreateReportRequest request,
                                       List<MultipartFile> images
    );

    ReportPageResponse getReports( // Lấy danh sách báo cáo với phân trang và lọc theo trạng thái
            Report.ReportStatus status,
            int page,
            int size
    );

    ReportDetailResponse getReportDetail(Integer reportId); // Lấy chi tiết báo cáo theo ID

    ReportDetailResponse resolveReport( // Xử lý báo cáo bởi nhân viên kiểm duyệt
                                        Integer moderatorId,
                                        Integer reportId,
                                        ResolveReportRequest request
    );

    ReportPageResponse getMyReports( // Lấy danh sách báo cáo của người dùng hiện tại với phân trang
            Integer userId,
            int page,
            int size
    );
}