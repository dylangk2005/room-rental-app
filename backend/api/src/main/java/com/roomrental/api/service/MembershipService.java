package com.roomrental.api.service;

import com.roomrental.api.dto.response.membership.MembershipLevelResponse;
import com.roomrental.api.dto.response.membership.MyMembershipResponse;
import com.roomrental.api.entity.User;

import java.util.List;

public interface MembershipService {
    List<MembershipLevelResponse> getLevels();
    MyMembershipResponse getMyLevel(Integer userId);
    void refreshUserMembership(User user);
}