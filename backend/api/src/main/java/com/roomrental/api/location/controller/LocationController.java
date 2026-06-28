package com.roomrental.api.location.controller;

import com.roomrental.api.location.dto.DistrictResponse;
import com.roomrental.api.location.dto.ProvinceResponse;
import com.roomrental.api.location.repository.DistrictRepository;
import com.roomrental.api.location.repository.ProvinceRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/provinces")
@RequiredArgsConstructor
public class LocationController {

    private final ProvinceRepository provinceRepository;
    private final DistrictRepository districtRepository;

    @GetMapping
    public List<ProvinceResponse> getProvinces() {
        return provinceRepository.findAll().stream()
                .map(p -> new ProvinceResponse(p.getId(), p.getName()))
                .toList();
    }

    @GetMapping("/{provinceId}/districts")
    public List<DistrictResponse> getDistricts(@PathVariable Integer provinceId) {
        return districtRepository.findByProvinceIdOrderByNameAsc(provinceId).stream()
                .map(d -> new DistrictResponse(d.getId(), d.getProvinceId(), d.getName()))
                .toList();
    }
}
