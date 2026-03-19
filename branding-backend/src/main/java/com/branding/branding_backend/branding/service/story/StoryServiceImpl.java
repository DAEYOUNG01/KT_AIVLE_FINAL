package com.branding.branding_backend.branding.service.story;

import com.branding.branding_backend.ai.AiClient;
import com.branding.branding_backend.branding.entity.*;
import com.branding.branding_backend.branding.repository.BrandOutputRepository;
import com.branding.branding_backend.branding.repository.BrandRepository;
import com.branding.branding_backend.branding.repository.BrandStateContextRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StoryServiceImpl implements StoryService {

    private final BrandRepository brandRepository;
    private final AiClient aiClient;
    private final BrandOutputRepository brandOutputRepository;
    private final BrandStateContextRepository brandStateContextRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public Map<String, Object> processStory(
            Long userId,
            Long brandId,
            Map<String, Object> storyInput
    ) {
        // 1. 브랜드 조회 + 검증
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new IllegalArgumentException("브랜드를 찾을 수 없습니다."));
        if (!brand.getUser().getUserId().equals(userId)) {
            throw new IllegalStateException("해당 브랜드에 대한 권한이 없습니다.");
        }
        if (brand.getCurrentStep() != CurrentStep.STORY) {
            throw new IllegalStateException("스토리 단계가 아닙니다.");
        }

        // 2. 이전 단계 Context 조회 & 사용자 선택 추가 (Interview, Naming, Concept)
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

        BrandOutput selectedName =
                brandOutputRepository
                        .findByBrandAndOutputType(brand, OutputType.NAME)
                        .orElseThrow(() -> new IllegalStateException("선택된 네이밍이 없습니다."));

        BrandOutput selectedConcept =
                brandOutputRepository
                        .findByBrandAndOutputType(brand, OutputType.CONCEPT)
                        .orElseThrow(() -> new IllegalStateException("선택된 컨셉이 없습니다."));
        storyInput.put("selected_name", selectedName.getBrandContent());
        storyInput.put("selected_concept", selectedConcept.getBrandContent());

        // 3. FastAPI로 전달할 payload 구성
        Map<String, Object> payload = Map.of(
                "user_input", storyInput,
                "context", Map.of(
                        CurrentStep.INTERVIEW.name(), interviewContext.getStateContext(),
                        CurrentStep.NAMING.name(), namingContext.getStateContext(),
                        CurrentStep.CONCEPT.name(), conceptContext.getStateContext()
                )
        );

        // 4. FastAPI 호출
        Map<String, Object> aiResponse =
                aiClient.requestStory(payload);

        Map<String, Object> result =
                (Map<String, Object>) aiResponse.get("result");
        Map<String, Object> stateContext =
                (Map<String, Object>) aiResponse.get("state_context");

        //5. 기존 Story Context 비활성화
        brandStateContextRepository
                .deactivateActiveByBrandAndStep(brand, CurrentStep.STORY);

        // 6. version 계산
        int nextVersion =
                brandStateContextRepository
                        .findMaxVersionByBrandAndStep(brand, CurrentStep.STORY) + 1;

        // 7. 새로운 Naming Context 저장
        String contextJson;
        try {
            contextJson = objectMapper.writeValueAsString(stateContext);
        } catch (Exception e) {
            throw new IllegalStateException("Story context JSON 변환 실패", e);
        }

        BrandStateContext context = new BrandStateContext();
        context.setBrand(brand);
        context.setStep(CurrentStep.STORY);
        context.setVersion(nextVersion);
        context.setIsActive(true);
        context.setStateContext(contextJson);

        brandStateContextRepository.save(context);

        // 8. 프론트로 AI 결과 반환
        return result;
    }

    @Override
    @Transactional
    public void selectStory(
            Long userId,
            Long brandId,
            String selectedStory
    ) {
        //브랜드 조회
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new IllegalArgumentException("브랜드를 찾을 수 없습니다."));
        //권한 검증
        if (!brand.getUser().getUserId().equals(userId)){
            throw new IllegalStateException("해당 브랜드에 대한 권한이 없습니다.");
        }
        //단계 검증
        if (brand.getCurrentStep() != CurrentStep.STORY) {
            throw new IllegalStateException("스토리 단계가 아닙니다.");
        }
        //기존 스토리 있으면 덮어쓰기
        BrandOutput output = brandOutputRepository
                .findByBrandAndOutputType(brand, OutputType.STORY)
                .orElseGet(BrandOutput::new);
        //값 세팅(덮어쓰기)
        output.setBrand(brand);
        output.setOutputType(OutputType.STORY);
        output.setBrandContent(selectedStory);

        //저장
        brandOutputRepository.save(output);

        brand.moveToLogo();
    }
}
