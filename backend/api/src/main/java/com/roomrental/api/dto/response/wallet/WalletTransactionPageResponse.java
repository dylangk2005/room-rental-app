package com.roomrental.api.dto.response.wallet;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class WalletTransactionPageResponse {

    private List<WalletTransactionResponse> transactions;

    private int currentPage;

    private int totalPages;

    private long totalElements;
}
