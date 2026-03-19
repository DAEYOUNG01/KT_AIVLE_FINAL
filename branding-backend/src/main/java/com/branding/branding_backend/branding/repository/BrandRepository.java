package com.branding.branding_backend.branding.repository;

import com.branding.branding_backend.branding.entity.Brand;
import com.branding.branding_backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BrandRepository extends JpaRepository<Brand, Long> {
    List<Brand> findByUserOrderByCreatedAtDesc(User user);
}
