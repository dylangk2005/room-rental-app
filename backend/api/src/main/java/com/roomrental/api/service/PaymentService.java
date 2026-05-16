package com.roomrental.api.service;

import com.roomrental.api.dto.request.payment.BoostPaymentRequest;
import com.roomrental.api.dto.request.payment.PayPostRequest;
import com.roomrental.api.dto.request.payment.RenewPaymentRequest;
import com.roomrental.api.dto.response.payment.PaymentResponse;

public interface PaymentService {

    PaymentResponse payPost(Integer userId, PayPostRequest request);

    PaymentResponse renewPost(Integer userId, RenewPaymentRequest request);

    PaymentResponse boostPost(Integer userId, BoostPaymentRequest request);
}
