package com.roomrental.api.payment.service;

import com.roomrental.api.payment.dto.request.BoostPaymentRequest;
import com.roomrental.api.payment.dto.response.PaymentResponse;
import com.roomrental.api.payment.dto.request.PayPostRequest;
import com.roomrental.api.payment.dto.request.RenewPaymentRequest;
import com.roomrental.api.payment.entity.Payment;

public interface PaymentService {

    PaymentResponse payPost(Integer userId, PayPostRequest request);

    PaymentResponse renewPost(Integer userId, RenewPaymentRequest request);

    PaymentResponse boostPost(Integer userId, BoostPaymentRequest request);
}