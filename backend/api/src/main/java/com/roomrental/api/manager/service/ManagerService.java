package com.roomrental.api.manager.service;

import com.roomrental.api.pricing.dto.request.UpdateMembershipLevelRequest;
import com.roomrental.api.pricing.dto.request.UpdatePostTypePriceRequest;

public interface ManagerService {
    void unbanUser(Integer managerId, Integer userId);
    void updatePostTypePrice(Integer managerId, UpdatePostTypePriceRequest request);
    void updateMembershipLevel(Integer managerId, Integer id, UpdateMembershipLevelRequest request);
}