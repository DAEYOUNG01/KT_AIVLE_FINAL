package com.branding.branding_backend.post;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PromotionPostRepository
        extends JpaRepository<PromotionPost, Long> {

    // 홍보 게시판 메인 목록 (최신순)
    List<PromotionPost> findAllByOrderByUpdatedAtDesc();

    // 특정 유저가 작성한 게시글
    List<PromotionPost> findByUser_UserId(Long userId);
}