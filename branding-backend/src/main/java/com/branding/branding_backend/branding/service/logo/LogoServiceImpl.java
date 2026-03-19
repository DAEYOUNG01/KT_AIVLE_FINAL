package com.branding.branding_backend.branding.service.logo;

import com.branding.branding_backend.ai.AiClient;
import com.branding.branding_backend.branding.entity.*;
import com.branding.branding_backend.branding.repository.BrandOutputRepository;
import com.branding.branding_backend.branding.repository.BrandRepository;
import com.branding.branding_backend.branding.repository.BrandStateContextRepository;
import com.branding.branding_backend.s3.DownloadedImage;
import com.branding.branding_backend.s3.ImageDownloader;
import com.branding.branding_backend.s3.S3Uploader;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LogoServiceImpl implements LogoService {

    private final BrandRepository brandRepository;
    private final AiClient aiClient;
    private final BrandOutputRepository brandOutputRepository;
    private final ImageDownloader imageDownloader;
    private final S3Uploader s3Uploader;
    private final BrandStateContextRepository brandStateContextRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public Map<String, Object> processLogo(
            Long userId,
            Long brandId,
            Map<String, Object> logoInput
    ) {
        // 1. 브랜드 조회 + 검증
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new IllegalArgumentException("브랜드를 찾을 수 없습니다."));
        if (!brand.getUser().getUserId().equals(userId)) {
            throw new IllegalStateException("해당 브랜드에 대한 권한이 없습니다.");
        }
        if (brand.getCurrentStep() != CurrentStep.LOGO) {
            throw new IllegalStateException("로고 단계가 아닙니다.");
        }

        // 2. 이전 단계 Context 조회
        BrandStateContext interviewContext =
                brandStateContextRepository
                        .findByBrandAndStepAndIsActiveTrue(brand, CurrentStep.INTERVIEW)
                        .orElseThrow(() -> new IllegalStateException("Interview context가 없습니다."));
        BrandStateContext namingContext =
                brandStateContextRepository
                        .findByBrandAndStepAndIsActiveTrue(brand, CurrentStep.NAMING)
                        .orElseThrow(() -> new IllegalStateException("Naming context가 없습니다."));
        BrandStateContext conceptContext =
                brandStateContextRepository
                        .findByBrandAndStepAndIsActiveTrue(brand, CurrentStep.CONCEPT)
                        .orElseThrow(() -> new IllegalStateException("Concept context가 없습니다."));
        BrandStateContext storyContext =
                brandStateContextRepository
                        .findByBrandAndStepAndIsActiveTrue(brand, CurrentStep.STORY)
                        .orElseThrow(() -> new IllegalStateException("Story context가 없습니다."));

        BrandOutput selectedName =
            brandOutputRepository
                    .findByBrandAndOutputType(brand, OutputType.NAME)
                    .orElseThrow(() -> new IllegalStateException("선택된 Name이 없습니다."));

        BrandOutput selectedConcept =
                brandOutputRepository
                        .findByBrandAndOutputType(brand, OutputType.CONCEPT)
                        .orElseThrow(() -> new IllegalStateException("선택된 컨셉이 없습니다."));

        BrandOutput selectedStory =
                brandOutputRepository
                        .findByBrandAndOutputType(brand, OutputType.STORY)
                        .orElseThrow(() -> new IllegalStateException("선택된 스토리가 없습니다."));

        logoInput.put("selected_name", selectedName.getBrandContent());
        logoInput.put("selected_concept", selectedConcept.getBrandContent());
        logoInput.put("selected_story", selectedStory.getBrandContent());

        // 3. FastAPI로 전달할 payload 구성
        Map<String, Object> payload = Map.of(
                "user_input", logoInput,
                "context", Map.of(
                        CurrentStep.INTERVIEW.name(), interviewContext.getStateContext(),
                        CurrentStep.NAMING.name(), namingContext.getStateContext(),
                        CurrentStep.CONCEPT.name(), conceptContext.getStateContext(),
                        CurrentStep.STORY.name(), storyContext.getStateContext()
                )
        );

        // 4. FastAPI 호출
        Map<String, Object> aiResponse =
                aiClient.requestLogo(payload);

        Map<String, Object> result =
                (Map<String, Object>) aiResponse.get("result");
        Map<String, Object> stateContext =
                (Map<String, Object>) aiResponse.get("state_context");

        // 5. 기존 Logo Context 비활성화
        brandStateContextRepository
                .deactivateActiveByBrandAndStep(brand, CurrentStep.LOGO);

        // 6. version 계산
        int nextVersion =
                brandStateContextRepository
                        .findMaxVersionByBrandAndStep(brand, CurrentStep.LOGO)+1;

        // 7. Logo Context 저장
        String contextJson;
        try {
            contextJson = objectMapper.writeValueAsString(stateContext);
        } catch (Exception e) {
            throw new IllegalStateException("Logo context JSON 변환 실패", e);
        }

        BrandStateContext context = new BrandStateContext();
        context.setBrand(brand);
        context.setStep(CurrentStep.LOGO);
        context.setVersion(nextVersion);
        context.setIsActive(true);
        context.setStateContext(contextJson);

        brandStateContextRepository.save(context);

        // 8. 프론트 AI 결과 반환
        return result;
    }

    @Override
    @Transactional
    public void selectLogo(
            Long userId,
            Long brandId,
            String selectedLogo
    ) {
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new IllegalArgumentException("브랜드를 찾을 수 없습니다."));

        if (!brand.getUser().getUserId().equals(userId)) {
            throw new IllegalStateException("해당 브랜드에 대한 권한이 없습니다.");
        }

        if (brand.getCurrentStep() != CurrentStep.LOGO) {
            throw new IllegalStateException("로고 단계가 아닙니다.");
        }

        // 1. 이미지 다운로드 (bytes + contentType 확보)
        DownloadedImage downloadedImage =
                imageDownloader.download(selectedLogo);

        //2. S3 업로드 (포맷/확장자 결정은 S3Uploader 책임)
        String s3Url = s3Uploader.upload(downloadedImage);

        // 3. BrandOutput(LOGO) 저장
        BrandOutput output = brandOutputRepository
                .findByBrandAndOutputType(brand, OutputType.LOGO)
                .orElseGet(BrandOutput::new);

        output.setBrand(brand);
        output.setOutputType(OutputType.LOGO);
        output.setBrandContent(s3Url);

        brandOutputRepository.save(output);

        // 4. 단계 변경
        brand.moveToFinal();
    }
}
