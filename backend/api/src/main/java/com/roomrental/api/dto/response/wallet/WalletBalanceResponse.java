package com.roomrental.api.dto.response.wallet;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class WalletBalanceResponse {

    private BigDecimal balance;
}
