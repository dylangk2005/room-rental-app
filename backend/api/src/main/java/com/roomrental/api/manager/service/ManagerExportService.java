package com.roomrental.api.manager.service;

import com.roomrental.api.manager.dto.request.PostListExportRequest;
import com.roomrental.api.manager.dto.request.ReportListExportRequest;
import com.roomrental.api.manager.dto.request.TransactionListExportRequest;
import com.roomrental.api.manager.dto.request.UserListExportRequest;

public interface ManagerExportService {
    byte[] exportPostList(PostListExportRequest request);
    byte[] exportUserList(UserListExportRequest request);
    byte[] exportTransactionList(TransactionListExportRequest request);
    byte[] exportReportList(ReportListExportRequest request);
}
