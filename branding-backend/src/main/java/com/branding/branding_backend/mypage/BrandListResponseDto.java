package com.branding.branding_backend.mypage;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class BrandListResponseDto {

    private Long brandId;
    //BrandOutput 기반
    private String brandName;
    private String logoUrl;
    private String concept;
    private String story;

    //Brand 기반
    private String currentStep;
    private LocalDateTime createdAt;

    public BrandListResponseDto(
            Long brandId,
            String brandName,
            String concept,
            String story,
            String currentStep,
            String logoUrl,
            LocalDateTime createdAt
    ) {
        this.brandId = brandId;
        this.brandName = brandName;
        this.logoUrl = logoUrl;
        this.concept = concept;
        this.story = story;
        this.currentStep = currentStep;
        this.createdAt = createdAt;
    }
}