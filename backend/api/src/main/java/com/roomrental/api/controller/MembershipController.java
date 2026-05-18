package com.roomrental.api.controller;

import com.roomrental.api.dto.response.common.ApiResponse;
import com.roomrental.api.dto.response.membership.MembershipLevelResponse;
import com.roomrental.api.dto.response.membership.MyMembershipResponse;
import com.roomrental.api.service.MembershipService;
import com.roomrental.api.util.AuthHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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