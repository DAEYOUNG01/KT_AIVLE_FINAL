package com.branding.branding_backend.ai;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class AiClientImpl implements AiClient {

    private final WebClient webClient;

    @Value("${ai.server.base-url}")
    private String aiServerBaseUrl;

    @Override
    public Map<String, Object> requestInterviewReport(
            Map<String, Object> interviewInput
    ) {
        return webClient
                .post()
                .uri(aiServerBaseUrl + "/brands/interview")
                .bodyValue(interviewInput)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }

    @Override
    public Map<String, Object> requestNaming(
            Map<String, Object> namingInput) {
        return webClient
                .post()
                .uri(aiServerBaseUrl + "/brands/naming")
                .bodyValue(namingInput)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }

    @Override
    public Map<String, Object> requestConcept(
            Map<String, Object> conceptInput
    ) {
        return webClient
                .post()
                .uri(aiServerBaseUrl + "/brands/concept")
                .bodyValue(conceptInput)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }

    @Override
    public Map<String, Object> requestStory(
            Map<String, Object> storyInput) {
        return webClient
                .post()
                .uri(aiServerBaseUrl + "/brands/story")
                .bodyValue(storyInput)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }

    @Override
    public Map<String, Object> requestLogo(
            Map<String, Object> logoInput) {
        return webClient
                .post()
                .uri(aiServerBaseUrl + "/brands/logo")
                .bodyValue(logoInput)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }
}
