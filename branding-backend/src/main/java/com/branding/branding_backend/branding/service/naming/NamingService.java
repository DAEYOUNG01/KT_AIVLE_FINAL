package com.branding.branding_backend.branding.service.naming;

import java.util.Map;

public interface NamingService {

    Map<String, Object> processNaming(
            Long userId,
            Long brandId,
            Map<String, Object> namingInput
    );

    void selectNaming(
            Long userId,
            Long brandId,
            String selectedName
    );
}
