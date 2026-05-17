package com.roomrental.api.service;

import com.roomrental.api.dto.request.report.CreateReportRequest;
import com.roomrental.api.dto.request.report.ResolveReportRequest;
import com.roomrental.api.dto.response.report.ReportPageResponse;
import com.roomrental.api.dto.response.report.ReportResponse;
import com.roomrental.api.entity.Report;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ReportService {

    ReportResponse createReport( // Tạo báo cáo mới
            Integer userId,
            CreateReportRequest request,
            List<MultipartFile> images
    );

    ReportPageResponse getReports( // Lấy danh sách báo cáo với phân trang và lọc theo trạng thái
            Report.ReportStatus status,
            int page,
            int size
    );

    ReportResponse getReportDetail(Integer reportId); // Lấy chi tiết báo cáo theo ID

    ReportResponse resolveReport( // Xử lý báo cáo bởi nhân viên kiểm duyệt
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