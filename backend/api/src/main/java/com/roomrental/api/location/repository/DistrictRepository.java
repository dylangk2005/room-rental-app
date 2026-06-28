package com.roomrental.api.location.repository;

import com.roomrental.api.location.entity.District;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DistrictRepository extends JpaRepository<District, Integer> {
    List<District> findByProvinceIdOrderByNameAsc(Integer provinceId);
}
