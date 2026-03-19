package com.branding.branding_backend.branding.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class InterviewReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "interview_id")
    private Long interviewId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @Column(name = "interview_report", columnDefinition = "TEXT")
    private String interviewReport;

    public InterviewReport(Brand brand, String interviewReport) {
        this.brand = brand;
        this.interviewReport = interviewReport;
    }
}
