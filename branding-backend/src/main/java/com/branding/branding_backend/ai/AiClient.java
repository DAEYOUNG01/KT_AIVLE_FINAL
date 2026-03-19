package com.branding.branding_backend.ai;

import java.util.Map;

public interface AiClient {

    Map<String, Object> requestInterviewReport(Map<String, Object> interviewInput);

    Map<String, Object> requestNaming(Map<String, Object> namingInput);

    Map<String, Object> requestConcept(Map<String, Object> conceptInput);

    Map<String, Object> requestStory(Map<String, Object> storyInput);

    Map<String, Object> requestLogo(Map<String, Object> logoInput);
}
