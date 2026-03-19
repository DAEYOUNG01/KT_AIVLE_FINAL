package com.branding.branding_backend.branding.service.interview;

import java.util.Map;

public interface InterviewService {

    Map<String, Object> processInterview(
            Long userId,
            Map<String, Object> interviewInput
    );
}
