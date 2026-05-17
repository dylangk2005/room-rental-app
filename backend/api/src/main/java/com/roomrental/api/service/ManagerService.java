package com.roomrental.api.service;

import com.roomrental.api.dto.request.manager.UpdateMembershipLevelRequest;
import com.roomrental.api.dto.request.manager.UpdatePostTypePriceRequest;

public interface ManagerService {
    void unbanUser(Integer managerId, Integer userId);
    void updatePostTypePrice(Integer managerId, UpdatePostTypePriceRequest request);
    void updateMembershipLevel(Integer managerId, Integer id, UpdateMembershipLevelRequest request);
}