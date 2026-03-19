package com.branding.branding_backend.branding.service.logo;

import java.util.Map;

public interface LogoService {

    Map<String, Object> processLogo(
            Long userId,
            Long brandId,
            Map<String, Object> logoInput
    );

    void selectLogo(
            Long userId,
            Long brandId,
            String selectedLogo
    );
}
