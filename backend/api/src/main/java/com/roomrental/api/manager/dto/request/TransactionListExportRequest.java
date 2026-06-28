package com.roomrental.api.manager.dto.request;

import java.time.LocalDate;
import lombok.Data;

@Data
public class TransactionListExportRequest {
    private String paymentType;
    private LocalDate from;
    private LocalDate to;
    private String exportedBy;
}
