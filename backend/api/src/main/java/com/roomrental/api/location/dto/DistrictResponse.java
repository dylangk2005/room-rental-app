package com.roomrental.api.location.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DistrictResponse {
    private Integer id;
    private Integer provinceId;
    private String name;
}
