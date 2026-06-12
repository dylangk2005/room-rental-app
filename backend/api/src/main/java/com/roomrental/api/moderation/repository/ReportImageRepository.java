package com.roomrental.api.moderation.repository;

import com.roomrental.api.moderation.entity.ReportImage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReportImageRepository extends JpaRepository<ReportImage, Integer> {
    List<ReportImage> findByReportId(Integer reportId);
}