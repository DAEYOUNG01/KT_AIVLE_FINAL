package com.branding.branding_backend.branding.service.story;

import java.util.Map;

public interface StoryService {

    Map<String, Object> processStory(
            Long userId,
            Long brandId,
            Map<String, Object> storyInput
    );

    void selectStory(
            Long userId,
            Long brandId,
            String selectedStory
    );
}
