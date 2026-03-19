package com.branding.branding_backend.mypage;

import com.branding.branding_backend.user.User;
import com.branding.branding_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/mypage")
public class MyPageController {

    private final MyPageService myPageService;
    private final UserRepository userRepository;

    //마이페이지 - 내가 생성한 브랜드 목록 조회
    @GetMapping("/brands")
    public ResponseEntity<List<BrandListResponseDto>> getMyBrands(
            Authentication authentication
    ) {
        Long userId = (Long) authentication.getPrincipal();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자"));

        List<BrandListResponseDto> response =
                myPageService.getMyBrands(user);

        return ResponseEntity.ok(response);
    }
    //마이페이지 - 브랜드 삭제
    @DeleteMapping("/brands/{brandId}")
    public ResponseEntity<Void> deleteBrand(
            @PathVariable Long brandId,
            Authentication authentication
    ) {
        Long userId = (Long) authentication.getPrincipal();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자"));

        myPageService.deleteBrand(user, brandId);

        return ResponseEntity.noContent().build();
    }
}
