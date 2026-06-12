package com.roomrental.api.pricing.service;

import com.roomrental.api.pricing.dto.response.MembershipLevelResponse;
import com.roomrental.api.pricing.dto.response.MyMembershipResponse;
import com.roomrental.api.user.entity.User;
import java.util.List;

public interface MembershipService {
    List<MembershipLevelResponse> getLevels();
    MyMembershipResponse getMyLevel(Integer userId);
    void refreshUserMembership(User user);
}