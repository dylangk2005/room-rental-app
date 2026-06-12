package com.roomrental.api.manager.controller;

import com.roomrental.api.common.dto.ApiResponse;
import com.roomrental.api.manager.dto.ModerationStatsResponse;
import com.roomrental.api.manager.dto.PostStatsResponse;
import com.roomrental.api.manager.dto.RevenueStatsResponse;
import com.roomrental.api.manager.dto.StatsExportType;
import com.roomrental.api.manager.dto.UserStatsResponse;
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

@RestController
@RequestMapping("/api/manager/stats")
@RequiredArgsConstructor
public class ManagerStatsController {

    private final ManagerStatsService managerStatsService;
    private final ManagerStatsExportService managerStatsExportService;

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

}