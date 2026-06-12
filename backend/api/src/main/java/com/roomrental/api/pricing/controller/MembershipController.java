package com.roomrental.api.pricing.controller;

import com.roomrental.api.common.dto.ApiResponse;
import com.roomrental.api.common.util.AuthHelper;
import com.roomrental.api.pricing.dto.response.MembershipLevelResponse;
import com.roomrental.api.pricing.dto.response.MyMembershipResponse;
import com.roomrental.api.pricing.service.MembershipService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/membership")
@RequiredArgsConstructor
public class MembershipController {

    private final MembershipService membershipService;
    private final AuthHelper authHelper;

    @GetMapping("/levels")
    public ResponseEntity<ApiResponse<List<MembershipLevelResponse>>> getLevels() {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách hạng thành viên thành công", membershipService.getLevels()));
    }

    @GetMapping("/my-level")
    public ResponseEntity<ApiResponse<MyMembershipResponse>> getMyLevel() {
        return ResponseEntity.ok(ApiResponse.success("Lấy hạng thành viên hiện tại thành công", membershipService.getMyLevel(authHelper.getCurrentUserId())));
    }
}