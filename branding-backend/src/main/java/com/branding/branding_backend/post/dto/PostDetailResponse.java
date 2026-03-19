package com.branding.branding_backend.post.dto;

import com.branding.branding_backend.post.PromotionPost;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@AllArgsConstructor
public class PostDetailResponse {

    private Long postId;

    private String companyName;
    private String shortDescription;
    private String logoImageUrl;
    private String region;

    private String contactName;
    private String contactEmail;

    private String companyDescription;
    private String companySize;

    private List<String> hashtags;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 추가: 프론트엔드에서 수정 권한 여부를 결정할 본인 확인 필드
    private boolean isOwner;

    // 수정: isOwner 매개변수를 추가함
    public static PostDetailResponse from(PromotionPost post, boolean isOwner) {

        List<String> hashtags = new ArrayList<>();
        if (post.getHashtag1() != null) hashtags.add(post.getHashtag1());
        if (post.getHashtag2() != null) hashtags.add(post.getHashtag2());
        if (post.getHashtag3() != null) hashtags.add(post.getHashtag3());
        if (post.getHashtag4() != null) hashtags.add(post.getHashtag4());
        if (post.getHashtag5() != null) hashtags.add(post.getHashtag5());

        return new PostDetailResponse(
                post.getPostId(),
                post.getCompanyName(),
                post.getShortDescription(),
                post.getLogoImageUrl(),
                post.getRegion(),
                post.getContactName(),
                post.getContactEmail(),
                post.getCompanyDescription(),
                post.getCompanySize(),
                hashtags,
                post.getCreatedAt(),
                post.getUpdatedAt(),
                isOwner
        );
    }
}
