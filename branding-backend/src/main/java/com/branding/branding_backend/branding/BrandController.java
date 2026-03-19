package com.branding.branding_backend.branding;

import com.branding.branding_backend.branding.dto.BrandSelectRequest;
import com.branding.branding_backend.branding.service.concept.ConceptServiceImpl;
import com.branding.branding_backend.branding.service.interview.InterviewService;
import com.branding.branding_backend.branding.service.logo.LogoServiceImpl;
import com.branding.branding_backend.branding.service.naming.NamingServiceImpl;
import com.branding.branding_backend.branding.service.story.StoryServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/brands")
public class BrandController {

    private final InterviewService interviewService;
    private final ConceptServiceImpl conceptServiceImpl;
    private final NamingServiceImpl namingServiceImpl;
    private final StoryServiceImpl storyServiceImpl;
    private final LogoServiceImpl logoServiceImpl;

    //브랜드 인터뷰 제출 + AI 진단 + 결과 반환
    @PostMapping("/interview")
    public ResponseEntity<Map<String, Object>> submitInterview(
            Authentication authentication,
            @RequestBody Map<String, Object> interviewInput
    ) {
        Long user = (Long) authentication.getPrincipal();

        Map<String, Object> result =
                interviewService.processInterview(user, interviewInput);

        return ResponseEntity.ok(result);
    }

    //브랜드 네이밍 폼 전송 + AI 결과 3개 생성
    @PostMapping("/{brandId}/naming")
    public ResponseEntity<Map<String, Object>> generateNaming(
            @PathVariable Long brandId,
            Authentication authentication,
            @RequestBody Map<String, Object> namingInput
    ) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(
                namingServiceImpl.processNaming(userId, brandId, namingInput)
        );
    }

    //브랜드 네이밍 선택(저장)
    @PostMapping("/{brandId}/naming/select")
    public ResponseEntity<Void> selectNaming(
            @PathVariable Long brandId,
            Authentication authentication,
            @RequestBody BrandSelectRequest request
    ) {
        Long userId = (Long) authentication.getPrincipal();
        namingServiceImpl.selectNaming(userId, brandId, request.getSelectedByUser());
        return ResponseEntity.ok().build();
    }

    //브랜드 컨셉 폼 전송 + AI 컨셉 결과 전달
    @PostMapping("/{brandId}/concept")
    public ResponseEntity<Map<String, Object>> generateConcept(
            @PathVariable Long brandId,
            Authentication authentication,
            @RequestBody Map<String, Object> conceptInput
    ) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(
                conceptServiceImpl.processConcept(userId, brandId, conceptInput)
        );
    }
    //브랜드 컨셉 선택(저장)
    @PostMapping("/{brandId}/concept/select")
    public ResponseEntity<Void> selectConcept(
            @PathVariable Long brandId,
            Authentication authentication,
            @RequestBody BrandSelectRequest request
    ) {
        Long userId = (Long) authentication.getPrincipal();
        conceptServiceImpl.selectConcept(userId, brandId, request.getSelectedByUser());
        return ResponseEntity.ok().build();
    }

    //스토리폼 전송 + AI 결과 전달
    @PostMapping("/{brandId}/story")
    public ResponseEntity<Map<String, Object>> generateStory(
            @PathVariable Long brandId,
            Authentication authentication,
            @RequestBody Map<String, Object> storyInput
    ) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(
                storyServiceImpl.processStory(userId, brandId, storyInput)
        );
    }

    //브랜드 스토리 저장
    @PostMapping("/{brandId}/story/select")
    public ResponseEntity<Void> selectStory(
            @PathVariable Long brandId,
            Authentication authentication,
            @RequestBody BrandSelectRequest request
    ) {
        Long userId = (Long) authentication.getPrincipal();
        storyServiceImpl.selectStory(userId, brandId, request.getSelectedByUser());
        return ResponseEntity.ok().build();
    }

    //로고폼 전송 + AI 결과 전달
    @PostMapping("/{brandId}/logo")
    public ResponseEntity<Map<String, Object>> generateLogo(
            @PathVariable Long brandId,
            Authentication authentication,
            @RequestBody Map<String, Object> logoInput
    ) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(
                logoServiceImpl.processLogo(userId, brandId, logoInput)
        );
    }
    //로고 저장
    @PostMapping("/{brandId}/logo/select")
    public ResponseEntity<Void> selectLogo(
            @PathVariable Long brandId,
            Authentication authentication,
            @RequestBody BrandSelectRequest request
    ) {
        Long userId = (Long) authentication.getPrincipal();
        logoServiceImpl.selectLogo(userId, brandId, request.getSelectedByUser());
        return ResponseEntity.ok().build();
    }
}
