package com.roomrental.api.controller;

import com.roomrental.api.dto.request.report.CreateReportRequest;
import com.roomrental.api.dto.request.report.ResolveReportRequest;
import com.roomrental.api.dto.response.common.ApiResponse;
import com.roomrental.api.dto.response.report.ReportPageResponse;
import com.roomrental.api.dto.response.report.ReportDetailResponse;
import com.roomrental.api.entity.Report;
import com.roomrental.api.service.ReportService;
import com.roomrental.api.util.AuthHelper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final AuthHelper authHelper;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReportDetailResponse>> createReport(
            @Valid @ModelAttribute CreateReportRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) {

        return ResponseEntity.ok(ApiResponse.success(
                "Gửi báo cáo thành công",
                reportService.createReport(authHelper.getCurrentUserId(), request, images)
        ));
    }

    @GetMapping
    @PreAuthorize("hasRole('MODERATOR')")
    public ResponseEntity<ApiResponse<ReportPageResponse>> getReports(
            @RequestParam(defaultValue = "PENDING") Report.ReportStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(ApiResponse.success(
                reportService.getReports(status, page, size)
        ));
    }

    @GetMapping("/my-history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReportPageResponse>> getMyReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(ApiResponse.success(
                reportService.getMyReports(authHelper.getCurrentUserId(), page, size)
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('MODERATOR')")
    public ResponseEntity<ApiResponse<ReportDetailResponse>> getReportDetail(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(
                reportService.getReportDetail(id)
        ));
    }

    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasRole('MODERATOR')")
    public ResponseEntity<ApiResponse<ReportDetailResponse>> resolveReport(
            @PathVariable Integer id,
            @Valid @RequestBody ResolveReportRequest request) {

        return ResponseEntity.ok(ApiResponse.success(
                "Xử lý báo cáo thành công",
                reportService.resolveReport(authHelper.getCurrentUserId(), id, request)
        ));
    }
}
