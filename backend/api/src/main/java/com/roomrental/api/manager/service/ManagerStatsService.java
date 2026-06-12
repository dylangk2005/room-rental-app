package com.roomrental.api.manager.service;

import com.roomrental.api.manager.dto.response.ModerationStatsResponse;
import com.roomrental.api.manager.dto.response.PostStatsResponse;
import com.roomrental.api.manager.dto.response.RevenueStatsResponse;
import com.roomrental.api.manager.dto.response.UserStatsResponse;
import java.time.LocalDate;

public interface ManagerStatsService {
    UserStatsResponse getUserStats(LocalDate from, LocalDate to); // Thống kê người dùng: số lượng người dùng mới, số lượng người dùng theo vai trò, v.v.

    PostStatsResponse getPostStats(LocalDate from, LocalDate to); // Thống kê bài đăng: số lượng bài đăng mới, số lượng bài đăng theo trạng thái (đang chờ duyệt, đã duyệt, bị từ chối), v.v.

    RevenueStatsResponse getRevenueStats(LocalDate from, LocalDate to); // Thống kê doanh thu

    ModerationStatsResponse getModerationStats(LocalDate from, LocalDate to); // Thống kê hoạt động kiểm duyệt: số lượng bài đăng được duyệt, số lượng bài đăng bị từ chối, số lượng báo cáo được giải quyết, v.v.
}