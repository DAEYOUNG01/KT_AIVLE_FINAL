package com.branding.branding_backend.branding.repository;

import com.branding.branding_backend.branding.entity.Brand;
import com.branding.branding_backend.branding.entity.BrandOutput;
import com.branding.branding_backend.branding.entity.OutputType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BrandOutputRepository extends JpaRepository<BrandOutput, Long> {

    Optional<BrandOutput> findByBrandAndOutputType(
            Brand brand,
            OutputType outputType);

    List<BrandOutput> findByBrandIn(List<Brand> brands);

    void deleteByBrand(Brand brand);
}
