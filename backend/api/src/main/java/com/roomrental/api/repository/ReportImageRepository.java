package com.roomrental.api.repository;

import com.roomrental.api.entity.ReportImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportImageRepository extends JpaRepository<ReportImage, Integer> {
    List<ReportImage> findByReportId(Integer reportId);
}
