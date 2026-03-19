package com.branding.branding_backend.s3;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class DownloadedImage {

    private final byte[] bytes;
    private final String contentType;
}
