package com.branding.branding_backend.branding.repository;

import com.branding.branding_backend.branding.entity.Brand;
import com.branding.branding_backend.branding.entity.BrandStateContext;
import com.branding.branding_backend.branding.entity.CurrentStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BrandStateContextRepository extends JpaRepository<BrandStateContext, Long> {

    // 1. 현재 활성 Context 조회 (step별 1개)
    Optional<BrandStateContext> findByBrandAndStepAndIsActiveTrue(
            Brand brand,
            CurrentStep step
    );

    // 2. 특정 brand의 여러 step에 대한 활성 Context들 조회 (Logo 단계 조회용)
    List<BrandStateContext> findByBrandAndStepInAndIsActiveTrue(
            Brand brand,
            List<CurrentStep> steps
    );

    // 3. 같은 brand+step의 최신 version 조회 (없으면 0)
    @Query("""
    select coalesce(max(c.version), 0)
    from BrandStateContext c
    where c.brand = :brand
      and c.step = :step
    """)
    int findMaxVersionByBrandAndStep(
            @Param("brand") Brand brand,
            @Param("step") CurrentStep step
    );

    // 4. 같은 brand+step에서 기존 active를 비활성화 (재생성 대비)
    @Modifying
    @Query("""
    update BrandStateContext c
    set c.isActive = false
    where c.brand = :brand
    and c.step = :step
    and c.isActive = true
    """)
    int deactivateActiveByBrandAndStep(
            @Param("brand") Brand brand,
            @Param("step") CurrentStep step
    );

    // 5. 브랜드 삭제 시 Context도 삭제
    void deleteByBrand(Brand brand);
}
