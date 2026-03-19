package com.branding.branding_backend.branding.repository;

import com.branding.branding_backend.branding.entity.Brand;
import com.branding.branding_backend.branding.entity.InterviewReport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterviewReportRepository extends JpaRepository<InterviewReport, Long> {
    void deleteByBrand(Brand brand);
}
