package com.branding.branding_backend.post.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PostUpdateRequest {

    private String companyName;
    private String shortDescription;
    private String region;

    private String contactName;
    private String contactEmail;

    private String companyDescription;
    private String companySize;

    private String hashtag1;
    private String hashtag2;
    private String hashtag3;
    private String hashtag4;
    private String hashtag5;
}