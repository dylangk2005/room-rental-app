package com.roomrental.api.moderation.controller;

import com.roomrental.api.common.dto.ApiResponse;
import com.roomrental.api.common.util.AuthHelper;
import com.roomrental.api.moderation.dto.CreateReportRequest;
import com.roomrental.api.moderation.dto.ReportDetailResponse;
import com.roomrental.api.moderation.dto.ReportPageResponse;
import com.roomrental.api.moderation.dto.ResolveReportRequest;
import com.roomrental.api.moderation.entity.Report;
import com.roomrental.api.moderation.service.ReportService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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