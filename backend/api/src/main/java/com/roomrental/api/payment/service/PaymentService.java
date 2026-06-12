package com.roomrental.api.payment.service;

import com.roomrental.api.payment.dto.BoostPaymentRequest;
import com.roomrental.api.payment.dto.PaymentResponse;
import com.roomrental.api.payment.dto.PayPostRequest;
import com.roomrental.api.payment.dto.RenewPaymentRequest;
import com.roomrental.api.payment.entity.Payment;

public interface PaymentService {

    PaymentResponse payPost(Integer userId, PayPostRequest request);

    PaymentResponse renewPost(Integer userId, RenewPaymentRequest request);

    PaymentResponse boostPost(Integer userId, BoostPaymentRequest request);
}