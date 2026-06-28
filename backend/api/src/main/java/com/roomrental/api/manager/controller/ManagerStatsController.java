package com.roomrental.api.manager.controller;

import com.roomrental.api.common.dto.ApiResponse;
import com.roomrental.api.manager.dto.request.PostListExportRequest;
import com.roomrental.api.manager.dto.request.ReportListExportRequest;
import com.roomrental.api.manager.dto.request.TransactionListExportRequest;
import com.roomrental.api.manager.dto.request.UserListExportRequest;
import com.roomrental.api.manager.dto.response.ModerationStatsResponse;
import com.roomrental.api.manager.dto.response.PostStatsResponse;
import com.roomrental.api.manager.dto.response.RevenueStatsResponse;
import com.roomrental.api.manager.dto.StatsExportType;
import com.roomrental.api.manager.dto.response.UserStatsResponse;
import com.roomrental.api.manager.service.ManagerExportService;
import com.roomrental.api.manager.service.ManagerStatsExportService;
import com.roomrental.api.manager.service.ManagerStatsService;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/manager/stats")
@RequiredArgsConstructor
public class ManagerStatsController {

    private final ManagerStatsService managerStatsService;
    private final ManagerStatsExportService managerStatsExportService;
    private final ManagerExportService managerExportService;

    @GetMapping("/users")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<UserStatsResponse>> getUserStats(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to) {

        return ResponseEntity.ok(ApiResponse.success(
                managerStatsService.getUserStats(from, to)
        ));
    }

    @GetMapping("/posts")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<PostStatsResponse>> getPostStats(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to) {

        return ResponseEntity.ok(ApiResponse.success(
                managerStatsService.getPostStats(from, to)
        ));
    }

    @GetMapping("/revenue")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<RevenueStatsResponse>> getRevenueStats(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to) {

        return ResponseEntity.ok(ApiResponse.success(
                managerStatsService.getRevenueStats(from, to)
        ));
    }

    @GetMapping("/moderation")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<ModerationStatsResponse>> getModerationStats(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to) {

        return ResponseEntity.ok(ApiResponse.success(
                managerStatsService.getModerationStats(from, to)
        ));
    }

    @GetMapping("/export")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<byte[]> exportStats(
            @RequestParam StatsExportType type,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to) {

        byte[] file = managerStatsExportService.exportStats(type, from, to);

        String fileName = type.name().toLowerCase() + "-stats.xlsx";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + fileName)
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                ))
                .body(file);
    }

    @PostMapping("/export/posts")
    @PreAuthorize("hasRole('MANAGER') or hasRole('MODERATOR')")
    public ResponseEntity<byte[]> exportPostList(@RequestBody PostListExportRequest request) {
        byte[] file = managerExportService.exportPostList(request);
        return buildExcelResponse(file, "danh-sach-tin-dang.xlsx");
    }

    @PostMapping("/export/users")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<byte[]> exportUserList(@RequestBody UserListExportRequest request) {
        byte[] file = managerExportService.exportUserList(request);
        return buildExcelResponse(file, "danh-sach-nguoi-dung.xlsx");
    }

    @PostMapping("/export/transactions")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<byte[]> exportTransactionList(@RequestBody TransactionListExportRequest request) {
        byte[] file = managerExportService.exportTransactionList(request);
        return buildExcelResponse(file, "giao-dich.xlsx");
    }

    @PostMapping("/export/reports")
    @PreAuthorize("hasRole('MANAGER') or hasRole('MODERATOR')")
    public ResponseEntity<byte[]> exportReportList(@RequestBody ReportListExportRequest request) {
        byte[] file = managerExportService.exportReportList(request);
        return buildExcelResponse(file, "bao-cao-vi-pham.xlsx");
    }

    private ResponseEntity<byte[]> buildExcelResponse(byte[] file, String fileName) {
        String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8)
                .replace("+", "%20");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + encodedFileName + "; filename*=UTF-8''" + encodedFileName)
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                ))
                .body(file);
    }

}