package com.branding.branding_backend.branding.service.interview;

import com.branding.branding_backend.ai.AiClient;
import com.branding.branding_backend.branding.entity.Brand;
import com.branding.branding_backend.branding.entity.BrandStateContext;
import com.branding.branding_backend.branding.entity.CurrentStep;
import com.branding.branding_backend.branding.entity.InterviewReport;
import com.branding.branding_backend.branding.repository.BrandRepository;
import com.branding.branding_backend.branding.repository.BrandStateContextRepository;
import com.branding.branding_backend.branding.repository.InterviewReportRepository;
import com.branding.branding_backend.user.User;
import com.branding.branding_backend.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class InterviewServiceImpl implements InterviewService {

    private final BrandRepository brandRepository;
    private final InterviewReportRepository interviewReportRepository;
    private final UserRepository userRepository;
    private final AiClient aiClient;
    private final ObjectMapper objectMapper;
    private final BrandStateContextRepository brandStateContextRepository;

    @Override
    public Map<String, Object> processInterview(
            Long userId,
            Map<String, Object> interviewInput
    ) {
        // 1. 사용자 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // 2. FastAPI 호출
        Map<String, Object> aiResponse =
                aiClient.requestInterviewReport(interviewInput);

        // 3. 브랜드 생성
        Brand brand = new Brand();
        brand.setUser(user);
        brand.setCurrentStep(CurrentStep.INTERVIEW);
        brandRepository.save(brand);

        // 4. 응답 분리
        Map<String, Object> report =
                (Map<String, Object>) aiResponse.get("result");
        Map<String, Object> stateContext =
                (Map<String, Object>) aiResponse.get("state_context");

        // 5. Interview Report 저장
        String reportJson;
        try {
            reportJson = objectMapper.writeValueAsString(report);
        } catch (Exception e) {
            throw new IllegalStateException(
                    "Interview report JSON 변환 실패", e
            );
        }

        InterviewReport interviewReport =
                new InterviewReport(brand, reportJson);
        interviewReportRepository.save(interviewReport);

        // 6. Context State 저장 (Interview)
        String contextJson;
        try {
            contextJson = objectMapper.writeValueAsString(stateContext);
        } catch (Exception e) {
            throw new IllegalStateException(
                    "Interview context JSON 변환 실패", e
            );
        }

        BrandStateContext context =
                new BrandStateContext();
        context.setBrand(brand);
        context.setStep(CurrentStep.INTERVIEW);
        context.setVersion(1);
        context.setIsActive(true);
        context.setStateContext(contextJson);

        brandStateContextRepository.save(context);

        // 7. NAMING으로 step 이동
        brand.moveToNaming();

        // 8. 프론트로 report 반환
        return Map.of(
                "brandId", brand.getBrandId(),
                "interviewReport", report
        );
    }
}
