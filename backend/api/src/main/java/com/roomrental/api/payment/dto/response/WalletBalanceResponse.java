package com.roomrental.api.payment.dto.response;

import com.roomrental.api.payment.entity.Payment;
import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WalletBalanceResponse {

    private BigDecimal balance;
}