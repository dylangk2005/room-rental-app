package com.roomrental.api.manager.service.impl;

import com.roomrental.api.common.exception.AppException;
import com.roomrental.api.manager.dto.request.PostListExportRequest;
import com.roomrental.api.manager.dto.request.ReportListExportRequest;
import com.roomrental.api.manager.dto.request.TransactionListExportRequest;
import com.roomrental.api.manager.dto.request.UserListExportRequest;
import com.roomrental.api.manager.service.ManagerExportService;
import com.roomrental.api.moderation.entity.Report;
import com.roomrental.api.moderation.repository.ReportRepository;
import com.roomrental.api.payment.entity.Payment;
import com.roomrental.api.payment.repository.PaymentRepository;
import com.roomrental.api.post.entity.Post;
import com.roomrental.api.post.repository.PostRepository;
import com.roomrental.api.user.entity.User;
import com.roomrental.api.user.repository.UserRepository;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ManagerExportServiceImpl implements ManagerExportService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final ReportRepository reportRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final NumberFormat CURRENCY_FORMATTER = NumberFormat.getNumberInstance(Locale.US);

    @Override
    public byte[] exportPostList(PostListExportRequest request) {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Danh sách tin đăng");

            Post.PostStatus status = request.getStatus() != null
                    ? Post.PostStatus.valueOf(request.getStatus())
                    : null;
            LocalDateTime from = request.getFrom() != null
                    ? request.getFrom().atStartOfDay()
                    : null;
            LocalDateTime to = request.getTo() != null
                    ? request.getTo().atTime(LocalTime.MAX)
                    : null;

            List<Post> posts = postRepository.findForExport(
                    status, request.getPostTypeId(),
                    request.getProvinceId(), request.getDistrictId(),
                    from, to, request.getKeyword()
            );

            int rowIndex = 0;
            rowIndex = writePostListHeader(sheet, workbook, rowIndex, request);

            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);

            for (Post post : posts) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(post.getId());
                row.createCell(1).setCellValue(post.getTitle() != null ? post.getTitle() : "");
                row.createCell(2).setCellValue(post.getUser() != null ? post.getUser().getFullName() : "");
                row.createCell(3).setCellValue(post.getUser() != null ? post.getUser().getPhoneNumber() : "");
                row.createCell(4).setCellValue(post.getRentalPrice() != null ? post.getRentalPrice().doubleValue() : 0);
                row.createCell(5).setCellValue(post.getArea() != null ? post.getArea().doubleValue() : 0);
                row.createCell(6).setCellValue(buildAddress(post));
                row.createCell(7).setCellValue(getStatusText(post.getStatus()));
                row.createCell(8).setCellValue(post.getPostType() != null ? post.getPostType().getName() : "");
                row.createCell(9).setCellValue(post.getCreatedAt() != null
                        ? post.getCreatedAt().format(DATETIME_FORMATTER) : "");
                row.createCell(10).setCellValue(post.getEndAt() != null
                        ? post.getEndAt().format(DATETIME_FORMATTER) : "");

                for (int i = 0; i <= 10; i++) {
                    row.getCell(i).setCellStyle(i == 4 ? currencyStyle : dataStyle);
                }
            }

            rowIndex += 2;
            rowIndex = writePostListSummary(sheet, workbook, rowIndex, posts);

            autoSizePostListColumns(sheet);

            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw AppException.badRequest("Không thể xuất file Excel danh sách tin đăng");
        }
    }

    @Override
    public byte[] exportUserList(UserListExportRequest request) {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Danh sách người dùng");

            User.UserStatus status = request.getStatus() != null
                    ? User.UserStatus.valueOf(request.getStatus())
                    : null;
            LocalDateTime from = request.getFrom() != null
                    ? request.getFrom().atStartOfDay()
                    : null;
            LocalDateTime to = request.getTo() != null
                    ? request.getTo().atTime(LocalTime.MAX)
                    : null;

            List<User> users = userRepository.findForExport(
                    status, request.getRole(), from, to, request.getKeyword()
            );

            int rowIndex = 0;
            rowIndex = writeUserListHeader(sheet, workbook, rowIndex, request);

            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);

            for (User user : users) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(user.getId());
                row.createCell(1).setCellValue(user.getFullName() != null ? user.getFullName() : "");
                row.createCell(2).setCellValue(user.getEmail() != null ? user.getEmail() : "");
                row.createCell(3).setCellValue(user.getPhoneNumber() != null ? user.getPhoneNumber() : "");
                row.createCell(4).setCellValue(user.getRole() != null ? getVietnameseRoleName(user.getRole().getName()) : "");
                row.createCell(5).setCellValue(user.getMembershipLevel() != null
                        ? user.getMembershipLevel().getName() : "");
                row.createCell(6).setCellValue(user.getCreatedAt() != null
                        ? user.getCreatedAt().format(DATE_FORMATTER) : "");
                row.createCell(7).setCellValue(getUserStatusText(user.getStatus()));
                row.createCell(8).setCellValue(user.getTotalSpent() != null
                        ? user.getTotalSpent().doubleValue() : 0);

                for (int i = 0; i <= 8; i++) {
                    row.getCell(i).setCellStyle(i == 8 ? currencyStyle : dataStyle);
                }
            }

            rowIndex += 2;
            rowIndex = writeUserListSummary(sheet, workbook, rowIndex, users);

            autoSizeUserListColumns(sheet);

            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw AppException.badRequest("Không thể xuất file Excel danh sách người dùng");
        }
    }

    @Override
    public byte[] exportTransactionList(TransactionListExportRequest request) {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Giao dịch");

            Payment.PaymentType paymentType = request.getPaymentType() != null
                    ? Payment.PaymentType.valueOf(request.getPaymentType())
                    : null;
            LocalDateTime from = request.getFrom() != null
                    ? request.getFrom().atStartOfDay()
                    : null;
            LocalDateTime to = request.getTo() != null
                    ? request.getTo().atTime(LocalTime.MAX)
                    : null;

            List<Payment> payments = paymentRepository.findForExport(paymentType, from, to);

            int rowIndex = 0;
            rowIndex = writeTransactionListHeader(sheet, workbook, rowIndex, request);

            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);

            BigDecimal totalRevenue = BigDecimal.ZERO;

            for (Payment payment : payments) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(payment.getId());
                row.createCell(1).setCellValue(payment.getUser() != null
                        ? payment.getUser().getFullName() : "");
                row.createCell(2).setCellValue(payment.getPost() != null
                        ? payment.getPost().getTitle() != null
                                ? payment.getPost().getTitle().substring(0,
                                        Math.min(50, payment.getPost().getTitle().length()))
                                : "Tin số " + payment.getPost().getId()
                        : "");
                row.createCell(3).setCellValue(getPaymentTypeText(payment.getPaymentType()));
                row.createCell(4).setCellValue(payment.getDays() != null ? payment.getDays() : 0);
                row.createCell(5).setCellValue(payment.getFinalFee() != null
                        ? payment.getFinalFee().doubleValue() : 0);
                row.createCell(6).setCellValue(payment.getCreatedAt() != null
                        ? payment.getCreatedAt().format(DATETIME_FORMATTER) : "");

                row.getCell(0).setCellStyle(dataStyle);
                row.getCell(1).setCellStyle(dataStyle);
                row.getCell(2).setCellStyle(dataStyle);
                row.getCell(3).setCellStyle(dataStyle);
                row.getCell(4).setCellStyle(dataStyle);
                row.getCell(5).setCellStyle(currencyStyle);
                row.getCell(6).setCellStyle(dataStyle);

                if (payment.getFinalFee() != null && payment.getPaymentType() != Payment.PaymentType.REFUND) {
                    totalRevenue = totalRevenue.add(payment.getFinalFee());
                } else if (payment.getFinalFee() != null) {
                    totalRevenue = totalRevenue.subtract(payment.getFinalFee());
                }
            }

            rowIndex += 2;
            rowIndex = writeTransactionListSummary(sheet, workbook, rowIndex, payments, totalRevenue);

            autoSizeTransactionListColumns(sheet);

            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw AppException.badRequest("Không thể xuất file Excel giao dịch");
        }
    }

    @Override
    public byte[] exportReportList(ReportListExportRequest request) {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Báo cáo vi phạm");

            Report.ReportStatus status = request.getStatus() != null
                    ? Report.ReportStatus.valueOf(request.getStatus())
                    : null;
            LocalDateTime from = request.getFrom() != null
                    ? request.getFrom().atStartOfDay()
                    : null;
            LocalDateTime to = request.getTo() != null
                    ? request.getTo().atTime(LocalTime.MAX)
                    : null;

            List<Report> reports = reportRepository.findForExport(status, from, to);

            int rowIndex = 0;
            rowIndex = writeReportListHeader(sheet, workbook, rowIndex, request);

            CellStyle dataStyle = createDataStyle(workbook);

            for (Report report : reports) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(report.getId());
                row.createCell(1).setCellValue(report.getUser() != null
                        ? report.getUser().getFullName() : "");
                row.createCell(2).setCellValue(report.getPost() != null
                        ? report.getPost().getTitle() != null
                                ? report.getPost().getTitle().substring(0,
                                        Math.min(50, report.getPost().getTitle().length()))
                                : "Tin số " + report.getPost().getId()
                        : "");
                row.createCell(3).setCellValue(report.getPost() != null
                        && report.getPost().getUser() != null
                        ? report.getPost().getUser().getFullName() : "");
                row.createCell(4).setCellValue(getReportStatusText(report.getStatus()));
                row.createCell(5).setCellValue(report.getReason() != null
                        ? report.getReason().substring(0, Math.min(100, report.getReason().length()))
                        : "");
                row.createCell(6).setCellValue(report.getCreatedAt() != null
                        ? report.getCreatedAt().format(DATETIME_FORMATTER) : "");
                row.createCell(7).setCellValue(report.getResolvedAt() != null
                        ? report.getResolvedAt().format(DATETIME_FORMATTER) : "");
                row.createCell(8).setCellValue(report.getModerator() != null
                        ? report.getModerator().getFullName() : "");
                row.createCell(9).setCellValue(report.getResolutionNote() != null
                        ? report.getResolutionNote().substring(0,
                                Math.min(100, report.getResolutionNote().length()))
                        : "");

                for (int i = 0; i <= 9; i++) {
                    row.getCell(i).setCellStyle(dataStyle);
                }
            }

            rowIndex += 2;
            rowIndex = writeReportListSummary(sheet, workbook, rowIndex, reports);

            autoSizeReportListColumns(sheet);

            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw AppException.badRequest("Không thể xuất file Excel báo cáo vi phạm");
        }
    }

    // ==================== Header Methods ====================

    private int writePostListHeader(Sheet sheet, Workbook workbook, int rowIndex,
                                     PostListExportRequest request) {
        CellStyle titleStyle = createTitleStyle(workbook);
        CellStyle labelStyle = createLabelStyle(workbook);

        Row titleRow = sheet.createRow(rowIndex++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("BÁO CÁO DANH SÁCH TIN ĐĂNG");
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(rowIndex - 1, rowIndex - 1, 0, 10));

        rowIndex++;

        Row dateRow = sheet.createRow(rowIndex++);
        Cell dateCell = dateRow.createCell(0);
        dateCell.setCellValue("Ngày xuất: " + LocalDate.now().format(DATE_FORMATTER));
        dateCell.setCellStyle(createCenterStyle(workbook));
        sheet.addMergedRegion(new CellRangeAddress(rowIndex - 1, rowIndex - 1, 0, 10));
        if (request.getExportedBy() != null) {
            Cell exporterCell = dateRow.createCell(0);
            exporterCell.setCellValue("Người xuất: " + request.getExportedBy()
                    + "          Ngày xuất: " + LocalDate.now().format(DATE_FORMATTER));
            exporterCell.setCellStyle(createCenterStyle(workbook));
        }

        rowIndex++;

        if (hasPostFilters(request)) {
            Row filterLabel = sheet.createRow(rowIndex++);
            filterLabel.createCell(0).setCellValue("Bộ lọc:");
            filterLabel.getCell(0).setCellStyle(labelStyle);

            if (request.getFrom() != null || request.getTo() != null) {
                String timeRange = (request.getFrom() != null ? request.getFrom().format(DATE_FORMATTER) : "?")
                        + " - " + (request.getTo() != null ? request.getTo().format(DATE_FORMATTER) : "?");
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue("  Thời gian: " + timeRange);
            }
            if (request.getStatus() != null) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue("  Trạng thái: " + getStatusText(
                        Post.PostStatus.valueOf(request.getStatus())));
            }
            if (request.getKeyword() != null && !request.getKeyword().isEmpty()) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue("  Từ khóa: " + request.getKeyword());
            }
        }

        rowIndex++;

        Row headerRow = sheet.createRow(rowIndex++);
        String[] headers = {"Mã tin", "Tiêu đề", "Người đăng tin", "Số điện thoại", "Giá thuê (VNĐ)",
                "Diện tích (m2)", "Địa chỉ", "Trạng thái", "Loại tin",
                "Ngày đăng", "Hạn"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(createHeaderStyle(workbook));
        }

        return rowIndex;
    }

    private int writeUserListHeader(Sheet sheet, Workbook workbook, int rowIndex,
                                     UserListExportRequest request) {
        CellStyle titleStyle = createTitleStyle(workbook);
        CellStyle labelStyle = createLabelStyle(workbook);

        Row titleRow = sheet.createRow(rowIndex++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("BÁO CÁO DANH SÁCH NGƯỜI DÙNG");
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(rowIndex - 1, rowIndex - 1, 0, 8));

        rowIndex++;

        Row dateRow = sheet.createRow(rowIndex++);
        Cell dateCell = dateRow.createCell(0);
        dateCell.setCellValue("Ngày xuất: " + LocalDate.now().format(DATE_FORMATTER));
        dateCell.setCellStyle(createCenterStyle(workbook));
        sheet.addMergedRegion(new CellRangeAddress(rowIndex - 1, rowIndex - 1, 0, 8));
        if (request.getExportedBy() != null) {
            Cell exporterCell = dateRow.createCell(0);
            exporterCell.setCellValue("Người xuất: " + request.getExportedBy()
                    + "          Ngày xuất: " + LocalDate.now().format(DATE_FORMATTER));
            exporterCell.setCellStyle(createCenterStyle(workbook));
        }

        rowIndex++;

        if (hasUserFilters(request)) {
            Row filterLabel = sheet.createRow(rowIndex++);
            filterLabel.createCell(0).setCellValue("Bộ lọc:");
            filterLabel.getCell(0).setCellStyle(labelStyle);

            if (request.getFrom() != null || request.getTo() != null) {
                String timeRange = (request.getFrom() != null ? request.getFrom().format(DATE_FORMATTER) : "?")
                        + " - " + (request.getTo() != null ? request.getTo().format(DATE_FORMATTER) : "?");
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue("  Thời gian: " + timeRange);
            }
            if (request.getStatus() != null) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue("  Trạng thái: " + getUserStatusText(
                        User.UserStatus.valueOf(request.getStatus())));
            }
            if (request.getRole() != null) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue("  Vai trò: " + request.getRole());
            }
            if (request.getKeyword() != null && !request.getKeyword().isEmpty()) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue("  Từ khóa: " + request.getKeyword());
            }
        }

        rowIndex++;

        Row headerRow = sheet.createRow(rowIndex++);
        String[] headers = {"ID", "Họ tên", "Email", "Số điện thoại", "Quyền",
                "Gói thành viên", "Ngày đăng ký", "Trạng thái", "Tổng chi tiêu (VNĐ)"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(createHeaderStyle(workbook));
        }

        return rowIndex;
    }

    private int writeTransactionListHeader(Sheet sheet, Workbook workbook, int rowIndex,
                                              TransactionListExportRequest request) {
        CellStyle titleStyle = createTitleStyle(workbook);
        CellStyle labelStyle = createLabelStyle(workbook);

        Row titleRow = sheet.createRow(rowIndex++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("BÁO CÁO GIAO DỊCH");
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(rowIndex - 1, rowIndex - 1, 0, 6));

        rowIndex++;

        Row dateRow = sheet.createRow(rowIndex++);
        Cell dateCell = dateRow.createCell(0);
        dateCell.setCellValue("Ngày xuất: " + LocalDate.now().format(DATE_FORMATTER));
        dateCell.setCellStyle(createCenterStyle(workbook));
        sheet.addMergedRegion(new CellRangeAddress(rowIndex - 1, rowIndex - 1, 0, 6));
        if (request.getExportedBy() != null) {
            Cell exporterCell = dateRow.createCell(0);
            exporterCell.setCellValue("Người xuất: " + request.getExportedBy()
                    + "          Ngày xuất: " + LocalDate.now().format(DATE_FORMATTER));
            exporterCell.setCellStyle(createCenterStyle(workbook));
        }

        rowIndex++;

        if (hasTransactionFilters(request)) {
            Row filterLabel = sheet.createRow(rowIndex++);
            filterLabel.createCell(0).setCellValue("Bộ lọc:");
            filterLabel.getCell(0).setCellStyle(labelStyle);

            if (request.getFrom() != null || request.getTo() != null) {
                String timeRange = (request.getFrom() != null ? request.getFrom().format(DATE_FORMATTER) : "?")
                        + " - " + (request.getTo() != null ? request.getTo().format(DATE_FORMATTER) : "?");
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue("  Thời gian: " + timeRange);
            }
            if (request.getPaymentType() != null) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue("  Loại giao dịch: " + getPaymentTypeText(
                        Payment.PaymentType.valueOf(request.getPaymentType())));
            }
        }

        rowIndex++;

        Row headerRow = sheet.createRow(rowIndex++);
        String[] headers = {"Mã GD", "Người thanh toán", "Tin đăng", "Loại", "Số ngày",
                "Số tiền (VNĐ)", "Ngày thanh toán"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(createHeaderStyle(workbook));
        }

        return rowIndex;
    }

    private int writeReportListHeader(Sheet sheet, Workbook workbook, int rowIndex,
                                       ReportListExportRequest request) {
        CellStyle titleStyle = createTitleStyle(workbook);
        CellStyle labelStyle = createLabelStyle(workbook);

        Row titleRow = sheet.createRow(rowIndex++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("BÁO CÁO VI PHẠM");
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(rowIndex - 1, rowIndex - 1, 0, 9));

        rowIndex++;

        Row dateRow = sheet.createRow(rowIndex++);
        Cell dateCell = dateRow.createCell(0);
        dateCell.setCellValue("Ngày xuất: " + LocalDate.now().format(DATE_FORMATTER));
        dateCell.setCellStyle(createCenterStyle(workbook));
        sheet.addMergedRegion(new CellRangeAddress(rowIndex - 1, rowIndex - 1, 0, 9));
        if (request.getExportedBy() != null) {
            Cell exporterCell = dateRow.createCell(0);
            exporterCell.setCellValue("Người xuất: " + request.getExportedBy()
                    + "          Ngày xuất: " + LocalDate.now().format(DATE_FORMATTER));
            exporterCell.setCellStyle(createCenterStyle(workbook));
        }

        rowIndex++;

        if (hasReportFilters(request)) {
            Row filterLabel = sheet.createRow(rowIndex++);
            filterLabel.createCell(0).setCellValue("Bộ lọc:");
            filterLabel.getCell(0).setCellStyle(labelStyle);

            if (request.getFrom() != null || request.getTo() != null) {
                String timeRange = (request.getFrom() != null ? request.getFrom().format(DATE_FORMATTER) : "?")
                        + " - " + (request.getTo() != null ? request.getTo().format(DATE_FORMATTER) : "?");
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue("  Thời gian: " + timeRange);
            }
            if (request.getStatus() != null) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue("  Trạng thái: " + getReportStatusText(
                        Report.ReportStatus.valueOf(request.getStatus())));
            }
        }

        rowIndex++;

        Row headerRow = sheet.createRow(rowIndex++);
        String[] headers = {"Mã BC", "Người báo cáo", "Tin đăng bị báo cáo",
                "Chủ tin bị báo cáo", "Trạng thái", "Lý do", "Ngày tạo",
                "Ngày xử lý", "Người xử lý", "Ghi chú"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(createHeaderStyle(workbook));
        }

        return rowIndex;
    }

    // ==================== Summary Methods ====================

    private int writePostListSummary(Sheet sheet, Workbook workbook, int rowIndex, List<Post> posts) {
        CellStyle summaryStyle = createSummaryStyle(workbook);

        Row labelRow = sheet.createRow(rowIndex++);
        labelRow.createCell(0).setCellValue("TÓM TẮT");
        labelRow.getCell(0).setCellStyle(summaryStyle);

        Row totalRow = sheet.createRow(rowIndex++);
        totalRow.createCell(0).setCellValue("Tổng số tin: " + posts.size());
        totalRow.getCell(0).setCellStyle(summaryStyle);

        long activeCount = posts.stream().filter(p -> p.getStatus() == Post.PostStatus.ACTIVE).count();
        long pendingCount = posts.stream().filter(p -> p.getStatus() == Post.PostStatus.PENDING).count();
        long rejectedCount = posts.stream().filter(p -> p.getStatus() == Post.PostStatus.REJECTED).count();

        Row statusRow = sheet.createRow(rowIndex++);
        statusRow.createCell(0).setCellValue("Đang hiển thị: " + activeCount + " | Chờ duyệt: " + pendingCount
                + " | Bị từ chối: " + rejectedCount);
        statusRow.getCell(0).setCellStyle(summaryStyle);

        return rowIndex;
    }

    private int writeUserListSummary(Sheet sheet, Workbook workbook, int rowIndex, List<User> users) {
        CellStyle summaryStyle = createSummaryStyle(workbook);

        Row labelRow = sheet.createRow(rowIndex++);
        labelRow.createCell(0).setCellValue("TÓM TẮT");
        labelRow.getCell(0).setCellStyle(summaryStyle);

        Row totalRow = sheet.createRow(rowIndex++);
        totalRow.createCell(0).setCellValue("Tổng số người dùng: " + users.size());
        totalRow.getCell(0).setCellStyle(summaryStyle);

        long activeCount = users.stream().filter(u -> u.getStatus() == User.UserStatus.ACTIVE).count();
        long inactiveCount = users.stream().filter(u -> u.getStatus() == User.UserStatus.INACTIVE).count();
        long bannedCount = users.stream().filter(u -> u.getStatus() == User.UserStatus.BANNED).count();

        Row statusRow = sheet.createRow(rowIndex++);
        statusRow.createCell(0).setCellValue("Hoạt động: " + activeCount + " | Chưa kích hoạt: " + inactiveCount
                + " | Bị khóa: " + bannedCount);
        statusRow.getCell(0).setCellStyle(summaryStyle);

        BigDecimal totalSpent = users.stream()
                .map(u -> u.getTotalSpent() != null ? u.getTotalSpent() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Row spentRow = sheet.createRow(rowIndex++);
        Cell spentCell = spentRow.createCell(0);
        spentCell.setCellValue("Tổng số tiền chi tiêu: " + String.format("%,.0f", totalSpent) + " VND");
        spentCell.setCellStyle(summaryStyle);

        return rowIndex;
    }

    private int writeTransactionListSummary(Sheet sheet, Workbook workbook, int rowIndex,
                                             List<Payment> payments, BigDecimal totalRevenue) {
        CellStyle summaryStyle = createSummaryStyle(workbook);

        Row labelRow = sheet.createRow(rowIndex++);
        labelRow.createCell(0).setCellValue("TÓM TẮT");
        labelRow.getCell(0).setCellStyle(summaryStyle);

        Row totalRow = sheet.createRow(rowIndex++);
        totalRow.createCell(0).setCellValue("Tổng số giao dịch: " + payments.size());
        totalRow.getCell(0).setCellStyle(summaryStyle);

        Row revenueRow = sheet.createRow(rowIndex++);
        revenueRow.createCell(0).setCellValue("Tổng doanh thu: " + String.format("%,.0f", totalRevenue) + " VND");
        revenueRow.getCell(0).setCellStyle(summaryStyle);

        long postPaymentCount = payments.stream()
                .filter(p -> p.getPaymentType() == Payment.PaymentType.POST_PAYMENT).count();
        long extendCount = payments.stream()
                .filter(p -> p.getPaymentType() == Payment.PaymentType.EXTEND).count();
        long pushCount = payments.stream()
                .filter(p -> p.getPaymentType() == Payment.PaymentType.PUSH).count();
        long refundCount = payments.stream()
                .filter(p -> p.getPaymentType() == Payment.PaymentType.REFUND).count();

        Row typeRow = sheet.createRow(rowIndex++);
        typeRow.createCell(0).setCellValue("Đăng tin: " + postPaymentCount + " | Gia hạn: " + extendCount
                + " | Đẩy tin: " + pushCount + " | Hoàn tiền: " + refundCount);
        typeRow.getCell(0).setCellStyle(summaryStyle);

        return rowIndex;
    }

    private int writeReportListSummary(Sheet sheet, Workbook workbook, int rowIndex, List<Report> reports) {
        CellStyle summaryStyle = createSummaryStyle(workbook);

        Row labelRow = sheet.createRow(rowIndex++);
        labelRow.createCell(0).setCellValue("TÓM TẮT");
        labelRow.getCell(0).setCellStyle(summaryStyle);

        Row totalRow = sheet.createRow(rowIndex++);
        totalRow.createCell(0).setCellValue("Tổng số báo cáo: " + reports.size());
        totalRow.getCell(0).setCellStyle(summaryStyle);

        long pendingCount = reports.stream()
                .filter(r -> r.getStatus() == Report.ReportStatus.PENDING).count();
        long resolvedCount = reports.stream()
                .filter(r -> r.getStatus() == Report.ReportStatus.RESOLVED).count();
        long rejectedCount = reports.stream()
                .filter(r -> r.getStatus() == Report.ReportStatus.REJECTED).count();

        Row statusRow = sheet.createRow(rowIndex++);
        statusRow.createCell(0).setCellValue("Chờ xử lý: " + pendingCount + " | Đã xử lý: " + resolvedCount
                + " | Bị từ chối: " + rejectedCount);
        statusRow.getCell(0).setCellStyle(summaryStyle);

        return rowIndex;
    }

    // ==================== Style Methods ====================

    private CellStyle createTitleStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 16);
        font.setFontName("Times New Roman");
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private CellStyle createLabelStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 11);
        font.setFontName("Times New Roman");
        style.setFont(font);
        return style;
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        font.setFontName("Times New Roman");
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createDataStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontName("Times New Roman");
        style.setFont(font);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createCurrencyStyle(Workbook workbook) {
        CellStyle style = createDataStyle(workbook);
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0"));
        return style;
    }

    private CellStyle createSummaryStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setItalic(true);
        font.setFontName("Times New Roman");
        style.setFont(font);
        return style;
    }

    private CellStyle createCenterStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontName("Times New Roman");
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private void autoSizePostListColumns(Sheet sheet) {
        int[] widths = {2500, 13000, 6000, 6000, 5000, 5000, 13000, 5000, 6000, 6000, 6000};
        for (int i = 0; i < widths.length; i++) {
            sheet.setColumnWidth(i, widths[i]);
        }
    }

    private void autoSizeUserListColumns(Sheet sheet) {
        int[] widths = {2500, 6000, 10000, 6000, 5000, 5000, 6000, 5000, 6000};
        for (int i = 0; i < widths.length; i++) {
            sheet.setColumnWidth(i, widths[i]);
        }
    }

    private void autoSizeTransactionListColumns(Sheet sheet) {
        int[] widths = {2500, 6000, 13000, 5000, 5000, 5000, 6000};
        for (int i = 0; i < widths.length; i++) {
            sheet.setColumnWidth(i, widths[i]);
        }
    }

    private void autoSizeReportListColumns(Sheet sheet) {
        int[] widths = {2500, 6000, 13000, 6000, 5000, 13000, 6000, 6000, 6000, 10000};
        for (int i = 0; i < widths.length; i++) {
            sheet.setColumnWidth(i, widths[i]);
        }
    }

    // ==================== Helper Methods ====================

    private String buildAddress(Post post) {
        StringBuilder sb = new StringBuilder();
        if (post.getAddress() != null) {
            sb.append(post.getAddress());
        }
        if (post.getDistrictRef() != null) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(post.getDistrictRef().getName());
        }
        if (post.getProvinceRef() != null) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(post.getProvinceRef().getName());
        }
        return sb.toString();
    }

    private String getStatusText(Post.PostStatus status) {
        if (status == null) return "";
        return switch (status) {
            case DRAFT -> "Nháp";
            case PENDING -> "Chờ duyệt";
            case ACTIVE -> "Đang hiển thị";
            case EXPIRED -> "Hết hạn";
            case REJECTED -> "Bị từ chối";
            case HIDDEN -> "Ẩn";
            case DELETED -> "Đã xóa";
        };
    }

    private String getUserStatusText(User.UserStatus status) {
        if (status == null) return "";
        return switch (status) {
            case ACTIVE -> "Hoạt động";
            case INACTIVE -> "Chưa kích hoạt";
            case BANNED -> "Bị khóa";
        };
    }

    private String getPaymentTypeText(Payment.PaymentType type) {
        if (type == null) return "";
        return switch (type) {
            case POST_PAYMENT -> "Đăng tin";
            case EXTEND -> "Gia hạn";
            case PUSH -> "Đẩy tin";
            case REFUND -> "Hoàn tiền";
        };
    }

    private String getReportStatusText(Report.ReportStatus status) {
        if (status == null) return "";
        return switch (status) {
            case PENDING -> "Chờ xử lý";
            case RESOLVED -> "Đã xử lý";
            case REJECTED -> "Bị từ chối";
        };
    }

    private String getVietnameseRoleName(String roleName) {
        if (roleName == null) return "";
        return switch (roleName.toUpperCase()) {
            case "ADMIN" -> "Quản trị viên";
            case "MANAGER" -> "Quản lý";
            case "MODERATOR" -> "Kiểm duyệt viên";
            case "USER" -> "Người dùng";
            default -> roleName;
        };
    }

    private boolean hasPostFilters(PostListExportRequest request) {
        return request.getFrom() != null || request.getTo() != null
                || request.getStatus() != null || request.getKeyword() != null;
    }

    private boolean hasUserFilters(UserListExportRequest request) {
        return request.getFrom() != null || request.getTo() != null
                || request.getStatus() != null || request.getRole() != null
                || (request.getKeyword() != null && !request.getKeyword().isEmpty());
    }

    private boolean hasTransactionFilters(TransactionListExportRequest request) {
        return request.getFrom() != null || request.getTo() != null
                || request.getPaymentType() != null;
    }

    private boolean hasReportFilters(ReportListExportRequest request) {
        return request.getFrom() != null || request.getTo() != null
                || request.getStatus() != null;
    }
}
