package com.branding.branding_backend.post;

import com.branding.branding_backend.post.dto.PostCreateRequest;
import com.branding.branding_backend.post.dto.PostDetailResponse;
import com.branding.branding_backend.post.dto.PostListResponse;
import com.branding.branding_backend.post.dto.PostUpdateRequest;
import com.branding.branding_backend.s3.S3Uploader;
import com.branding.branding_backend.user.User;
import com.branding.branding_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PromotionPostService {

    private final PromotionPostRepository postRepository;
    private final UserRepository userRepository;
    private final S3Uploader s3Uploader;

    /* ================= 홍보물 등록 ================= */
    public Long createPost(
            Long userId,
            PostCreateRequest request,
            MultipartFile image
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        String imageUrl = s3Uploader.upload(image);

        PromotionPost post = PromotionPost.create(user, request, imageUrl);
        return postRepository.save(post).getPostId();
    }

    /* ================= 목록 조회 ================= */
    @Transactional(readOnly = true)
    public List<PostListResponse> getPostList() {

        List<PromotionPost> posts = postRepository.findAllByOrderByUpdatedAtDesc();
        List<PostListResponse> result = new ArrayList<>();

        for (PromotionPost post : posts) {
            result.add(PostListResponse.from(post));
        }

        return result;
    }

    /* ================= 상세 조회 ================= */
    @Transactional(readOnly = true)
    public PostDetailResponse getPostDetail(Long postId, Long currentUserId) { // currentUserId 추가

        PromotionPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        // 본인 확인 로직: 로그인 중이고(not null), 게시글 주인 ID와 접속자 ID가 일치하는지 확인
        // 기존 update/delete 로직에서 사용하신 getUserId()를 그대로 사용했습니다.
        boolean isOwner = currentUserId != null && post.getUser().getUserId().equals(currentUserId);

        // 수정된 from 메서드에 isOwner를 담아서 반환
        return PostDetailResponse.from(post, isOwner);
    }

    /* ================= 수정 ================= */
    public void updatePost(
            Long postId,
            Long userId,
            PostUpdateRequest request,
            MultipartFile image
    ) {
        PromotionPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        if (!post.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("수정 권한이 없습니다.");
        }

        post.update(request);

        if (image != null && !image.isEmpty()) {

            if (post.getLogoImageUrl() != null) {
                s3Uploader.delete(post.getLogoImageUrl());
            }

            String newImageUrl = s3Uploader.upload(image);
            post.updateImage(newImageUrl);
        }
    }

    /* ================= 삭제 ================= */
    public void deletePost(Long postId, Long userId) {

        PromotionPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        if (!post.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("삭제 권한이 없습니다.");
        }

        if (post.getLogoImageUrl() != null) {
            s3Uploader.delete(post.getLogoImageUrl());
        }

        postRepository.delete(post);
    }
}