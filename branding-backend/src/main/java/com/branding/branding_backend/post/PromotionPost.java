package com.branding.branding_backend.post;

import com.branding.branding_backend.post.dto.PostCreateRequest;
import com.branding.branding_backend.post.dto.PostUpdateRequest;
import com.branding.branding_backend.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "promotion_posts")
@Getter
@NoArgsConstructor
public class PromotionPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "post_id")
    private Long postId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "short_description", length = 512, nullable = false)
    private String shortDescription;

    @Column(name = "logo_image_url", length = 2048)
    private String logoImageUrl;

    @Column(length = 50)
    private String region;

    @Column(name = "contact_name", length = 50)
    private String contactName;

    @Column(name = "contact_email", length = 100)
    private String contactEmail;

    @Lob
    @Column(name = "company_description")
    private String companyDescription;

    @Column(name = "company_size", nullable = false)
    private String companySize;

    @Column(length = 50)
    private String hashtag1;
    @Column(length = 50)
    private String hashtag2;
    @Column(length = 50)
    private String hashtag3;
    @Column(length = 50)
    private String hashtag4;
    @Column(length = 50)
    private String hashtag5;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /* ================= JPA 생명주기 ================= */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /* ================= 생성 ================= */
    public static PromotionPost create(
            User user,
            PostCreateRequest request,
            String imageUrl
    ) {
        PromotionPost post = new PromotionPost();
        post.user = user;
        post.companyName = request.getCompanyName();
        post.shortDescription = request.getShortDescription();
        post.region = request.getRegion();
        post.logoImageUrl = imageUrl;
        post.contactName = request.getContactName();
        post.contactEmail = request.getContactEmail();
        post.companyDescription = request.getCompanyDescription();
        post.companySize = request.getCompanySize();
        post.hashtag1 = request.getHashtag1();
        post.hashtag2 = request.getHashtag2();
        post.hashtag3 = request.getHashtag3();
        post.hashtag4 = request.getHashtag4();
        post.hashtag5 = request.getHashtag5();
        return post;
    }

    /* ================= 텍스트 정보 수정 ================= */
    public void update(PostUpdateRequest request) {
        this.companyName = request.getCompanyName();
        this.shortDescription = request.getShortDescription();
        this.region = request.getRegion();
        this.contactName = request.getContactName();
        this.contactEmail = request.getContactEmail();
        this.companyDescription = request.getCompanyDescription();
        this.companySize = request.getCompanySize();
        this.hashtag1 = request.getHashtag1();
        this.hashtag2 = request.getHashtag2();
        this.hashtag3 = request.getHashtag3();
        this.hashtag4 = request.getHashtag4();
        this.hashtag5 = request.getHashtag5();
    }

    /* ================= 이미지 수정 ================= */
    public void updateImage(String imageUrl) {
        this.logoImageUrl = imageUrl;
    }
}