package com.roomrental.api.dto.request.wallet;

import lombok.Data;

import java.util.Map;

@Data
public class VnPayCallbackRequest {

    private Map<String, String> params;
}
