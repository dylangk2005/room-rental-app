package com.roomrental.api.payment.dto.response;

import com.roomrental.api.payment.entity.Payment;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WalletTransactionPageResponse {

    private List<WalletTransactionResponse> transactions;

    private int currentPage;

    private int totalPages;

    private long totalElements;
}