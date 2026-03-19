package com.branding.branding_backend.branding.service.naming;

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
public class NamingServiceImpl implements NamingService {

    private final BrandRepository brandRepository;
    private final AiClient aiClient;
    private final BrandOutputRepository brandOutputRepository;
    private final BrandStateContextRepository brandStateContextRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public Map<String, Object> processNaming(
            Long userId,
            Long brandId,
            Map<String, Object> namingInput
    ) {
        // 1. 브랜드 조회 + 검증
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new IllegalArgumentException("브랜드를 찾을 수 없습니다."));
        if (!brand.getUser().getUserId().equals(userId)) {
            throw new IllegalStateException("해당 브랜드에 대한 권한이 없습니다.");
        }
        if (brand.getCurrentStep() != CurrentStep.NAMING) {
            throw new IllegalStateException("네이밍 단계가 아닙니다.");
        }

        // 2. 이전 단계 Context 조회 (Interview)
        BrandStateContext interviewContext =
                brandStateContextRepository
                        .findByBrandAndStepAndIsActiveTrue(brand, CurrentStep.INTERVIEW)
                        .orElseThrow(() -> new IllegalStateException("Interview Context가 없습니다."));

        // 3. FastAPI로 전달할 payload 구성
        Map<String, Object> payload = Map.of(
                "user_input", namingInput,
                "context", Map.of(
                        "INTERVIEW", interviewContext.getStateContext()
                )
        );

        // 4. FastAPI 호출
        Map<String, Object> aiResponse =
                aiClient.requestNaming(payload);

        Map<String, Object> result =
                (Map<String, Object>) aiResponse.get("result");
        Map<String, Object> stateContext =
                (Map<String, Object>) aiResponse.get("state_context");

        //5. 기존 Naming Context 비활성화 (재생성 고려)
        brandStateContextRepository
                .deactivateActiveByBrandAndStep(brand, CurrentStep.NAMING);

        // 6. version 계산
        int nextVersion =
                brandStateContextRepository.findMaxVersionByBrandAndStep(brand, CurrentStep.NAMING) + 1;

        // 7. 새로운 Naming Context 저장
        String contextJson;
        try {
            contextJson = objectMapper.writeValueAsString(stateContext);
        } catch (Exception e){
            throw new IllegalStateException("Naming context JSON 변환 실패", e);
        }

        BrandStateContext context = new BrandStateContext();
        context.setBrand(brand);
        context.setStep(CurrentStep.NAMING);
        context.setVersion(nextVersion);
        context.setIsActive(true);
        context.setStateContext(contextJson);

        brandStateContextRepository.save(context);

        // 8. 프론트로 AI 결과 반환
        return result;
    }

    @Override
    @Transactional
    public void selectNaming(
            Long userId,
            Long brandId,
            String selectedName
    ) {
        //브랜드 조회
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new IllegalArgumentException("브랜드를 찾을 수 없습니다."));
        //권한 검증
        if (!brand.getUser().getUserId().equals(userId)){
            throw new IllegalStateException("해당 브랜드에 대한 권한이 없습니다.");
        }
        //단계 검증
        if (brand.getCurrentStep() != CurrentStep.NAMING) {
            throw new IllegalStateException("네이밍 단계가 아닙니다.");
        }
        //기존 네이밍 있으면 덮어쓰기
        BrandOutput output = brandOutputRepository
                .findByBrandAndOutputType(brand, OutputType.NAME)
                .orElseGet(BrandOutput::new);

        //값 세팅 (덮어쓰기)
        output.setBrand(brand);
        output.setOutputType(OutputType.NAME);
        output.setBrandContent(selectedName);

        //저장
        brandOutputRepository.save(output);

        brand.moveToConcept();
    }
}
