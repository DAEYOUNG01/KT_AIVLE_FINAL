package com.branding.branding_backend.auth;

import com.branding.branding_backend.security.JwtProvider;
import com.branding.branding_backend.security.LoginResponse;
import com.branding.branding_backend.user.User;
import com.branding.branding_backend.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    @PostMapping("/register")
    public void register(@RequestBody RegisterRequest request) {
        userService.register(
                request.getLoginId(),
                request.getEmail(),
                request.getPassword(),
                request.getMobileNumber(),
                request.getUsername()
        );
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        User user = userService.findByLoginId(request.getLoginId());

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        String accessToken = jwtProvider.createAccessToken(
                user.getUserId(),
                user.getLoginId(),
                user.getRole().name()
        );

        return new LoginResponse(accessToken);
    }

    @PostMapping("/logout")
    public void logout() {
        // JWT 기반에서는 보통 서버 로직 없음 (프론트에서 토큰 삭제)
    }
}