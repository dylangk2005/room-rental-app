package com.roomrental.api.service.impl;

import com.roomrental.api.dto.request.manager.StatsExportType;
import com.roomrental.api.dto.response.manager.*;
import com.roomrental.api.exception.AppException;
import com.roomrental.api.service.ManagerStatsExportService;
import com.roomrental.api.service.ManagerStatsService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class ManagerStatsExportServiceImpl implements ManagerStatsExportService {

    private final ManagerStatsService managerStatsService;

    @Override
    public byte[] exportStats(StatsExportType type, LocalDate from, LocalDate to) {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            switch (type) {
                case USERS -> writeUserStats(workbook, from, to);
                case POSTS -> writePostStats(workbook, from, to);
                case REVENUE -> writeRevenueStats(workbook, from, to);
                case MODERATION -> writeModerationStats(workbook, from, to);
            }

            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw AppException.badRequest("Không thể xuất báo cáo Excel");
        }
    }

    private void writeUserStats(Workbook workbook, LocalDate from, LocalDate to) {
        UserStatsResponse stats = managerStatsService.getUserStats(from, to);
        Sheet sheet = workbook.createSheet("Người dùng");

        writeHeader(sheet, "Chỉ số", "Giá trị");
        writeRow(sheet, 1, "Tổng số người dùng", stats.getTotalUsers());
        writeRow(sheet, 2, "Người dùng mới", stats.getNewUsers());
        writeRow(sheet, 3, "Đang hoạt động", stats.getActiveUsers());
        writeRow(sheet, 4, "Chưa kích hoạt", stats.getInactiveUsers());
        writeRow(sheet, 5, "Đã bị khóa", stats.getBannedUsers());

        autoSize(sheet, 2);
    }

    private void writePostStats(Workbook workbook, LocalDate from, LocalDate to) {
        PostStatsResponse stats = managerStatsService.getPostStats(from, to);
        Sheet summary = workbook.createSheet("Tin đăng");

        writeHeader(summary, "Chỉ số", "Giá trị");
        writeRow(summary, 1, "Tổng số tin đăng", stats.getTotalPosts());
        writeRow(summary, 2, "Tin đăng mới", stats.getNewPosts());
        writeRow(summary, 3, "Tin nháp", stats.getDraftPosts());
        writeRow(summary, 4, "Tin chờ duyệt", stats.getPendingPosts());
        writeRow(summary, 5, "Tin đang hiển thị", stats.getActivePosts());
        writeRow(summary, 6, "Tin bị từ chối", stats.getRejectedPosts());
        writeRow(summary, 7, "Tin hết hạn", stats.getExpiredPosts());
        writeRow(summary, 8, "Tin bị ẩn", stats.getHiddenPosts());
        writeRow(summary, 9, "Tin đã xóa", stats.getDeletedPosts());
        autoSize(summary, 2);

        Sheet byType = workbook.createSheet("Theo loai tin");
        writeHeader(byType, "Loại tin", "Số lượng");

        int rowIndex = 1;
        for (PostTypeStatsResponse item : stats.getByPostType()) {
            writeRow(byType, rowIndex++, item.getPostTypeName(), item.getTotalPosts());
        }

        autoSize(byType, 2);
    }

    private void writeRevenueStats(Workbook workbook, LocalDate from, LocalDate to) {
        RevenueStatsResponse stats = managerStatsService.getRevenueStats(from, to);
        Sheet sheet = workbook.createSheet("Doanh thu");

        writeHeader(sheet, "Chỉ số", "Số tiền");
        writeRow(sheet, 1, "Doanh thu gộp", stats.getGrossRevenue());
        writeRow(sheet, 2, "Doanh thu đăng tin", stats.getPostPaymentRevenue());
        writeRow(sheet, 3, "Doanh thu gia hạn tin", stats.getRenewRevenue());
        writeRow(sheet, 4, "Doanh thu đẩy tin", stats.getPushRevenue());
        writeRow(sheet, 5, "Số tiền đã hoàn", stats.getRefundAmount());
        writeRow(sheet, 6, "Doanh thu ròng", stats.getNetRevenue());

        autoSize(sheet, 2);
    }

    private void writeModerationStats(Workbook workbook, LocalDate from, LocalDate to) {
        ModerationStatsResponse stats = managerStatsService.getModerationStats(from, to);
        Sheet summary = workbook.createSheet("Kiểm duyệt");

        writeHeader(summary, "Chỉ số", "Giá trị");
        writeRow(summary, 1, "Tin đã duyệt", stats.getApprovedPosts());
        writeRow(summary, 2, "Tin bị từ chối", stats.getRejectedPosts());
        writeRow(summary, 3, "Báo cáo đã xử lý đúng", stats.getResolvedReports());
        writeRow(summary, 4, "Báo cáo bị từ chối", stats.getRejectedReports());
        writeRow(summary, 5, "Cảnh báo người dùng", stats.getWarnings());
        writeRow(summary, 6, "Khóa đăng tin", stats.getLockedPosts());
        writeRow(summary, 7, "Khóa tài khoản", stats.getBannedAccounts());
        writeRow(summary, 8, "Tổng số thao tác", stats.getTotalActions());
        autoSize(summary, 2);

        Sheet byModerator = workbook.createSheet("Theo nhân viên kiểm duyệt");
        writeHeader(
                byModerator,
                "Mã nhân viên",
                "Tên nhân viên",
                "Tin đã duyệt",
                "Tin bị từ chối",
                "Báo cáo đúng",
                "Báo cáo bị từ chối",
                "Cảnh báo",
                "Khóa đăng tin",
                "Khóa tài khoản",
                "Tổng thao tác"
        );

        int rowIndex = 1;
        for (ModeratorStatsResponse item : stats.getByModerator()) {
            writeRow(
                    byModerator,
                    rowIndex++,
                    item.getModeratorId(),
                    item.getModeratorName(),
                    item.getApprovedPosts(),
                    item.getRejectedPosts(),
                    item.getResolvedReports(),
                    item.getRejectedReports(),
                    item.getWarnings(),
                    item.getLockedPosts(),
                    item.getBannedAccounts(),
                    item.getTotalActions()
            );
        }

        autoSize(byModerator, 10);
    }

    private void writeHeader(Sheet sheet, String... values) {
        Row row = sheet.createRow(0);

        CellStyle style = sheet.getWorkbook().createCellStyle();
        Font font = sheet.getWorkbook().createFont();
        font.setBold(true);
        style.setFont(font);

        for (int i = 0; i < values.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellValue(values[i]);
            cell.setCellStyle(style);
        }
    }

    private void writeRow(Sheet sheet, int rowIndex, Object... values) {
        Row row = sheet.createRow(rowIndex);

        for (int i = 0; i < values.length; i++) {
            Cell cell = row.createCell(i);
            Object value = values[i];

            if (value == null) {
                cell.setCellValue("");
            } else if (value instanceof Number number) {
                cell.setCellValue(number.doubleValue());
            } else if (value instanceof BigDecimal decimal) {
                cell.setCellValue(decimal.doubleValue());
            } else {
                cell.setCellValue(value.toString());
            }
        }
    }

    private void autoSize(Sheet sheet, int columns) {
        for (int i = 0; i < columns; i++) {
            sheet.autoSizeColumn(i);
        }
    }
}