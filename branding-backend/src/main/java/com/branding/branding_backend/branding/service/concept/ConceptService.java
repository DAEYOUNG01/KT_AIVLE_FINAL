package com.branding.branding_backend.branding.service.concept;

import java.util.Map;

public interface ConceptService {

    Map<String, Object> processConcept(
            Long userId,
            Long brandId,
            Map<String, Object> conceptInput
    );

    void selectConcept(
            Long userId,
            Long brandId,
            String selectConcept
    );
}
