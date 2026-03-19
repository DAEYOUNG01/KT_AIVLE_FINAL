package com.branding.branding_backend.post.dto;

import com.branding.branding_backend.post.PromotionPost;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@AllArgsConstructor
public class PostListResponse {

    private Long postId;
    private String companyName;
    private String shortDescription;
    private String logoImageUrl;
    private String region;
    private String companySize;
    private List<String> hashtags;
    private LocalDateTime updatedAt;

    public static PostListResponse from(PromotionPost post) {

        List<String> hashtags = new ArrayList<>();
        if (post.getHashtag1() != null) hashtags.add(post.getHashtag1());
        if (post.getHashtag2() != null) hashtags.add(post.getHashtag2());
        if (post.getHashtag3() != null) hashtags.add(post.getHashtag3());
        if (post.getHashtag4() != null) hashtags.add(post.getHashtag4());
        if (post.getHashtag5() != null) hashtags.add(post.getHashtag5());

        return new PostListResponse(
                post.getPostId(),
                post.getCompanyName(),
                post.getShortDescription(),
                post.getLogoImageUrl(),
                post.getRegion(),
                post.getCompanySize(),
                hashtags,
                post.getUpdatedAt()
        );
    }
}