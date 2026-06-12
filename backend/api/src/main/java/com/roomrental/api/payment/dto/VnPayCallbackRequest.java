package com.roomrental.api.payment.dto;

import com.roomrental.api.payment.entity.Payment;
import java.util.Map;
import lombok.Data;

@Data
public class VnPayCallbackRequest {

    private Map<String, String> params;
}