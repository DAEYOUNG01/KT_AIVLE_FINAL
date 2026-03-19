package com.branding.branding_backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;

    // Swagger / Auth는 JWT 검사 제외
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();

        return path.startsWith("/auth")
                || path.startsWith("/api/auth")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/api/swagger-ui")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/api/v3/api-docs")
                || path.equals("/swagger-ui.html")
                || path.equals("/api/swagger-ui.html");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();
        String authHeader = request.getHeader("Authorization");

        // 요청 들어오는지 / 헤더 붙는지 확인
        System.out.println("[JWT-FILTER] " + method + " " + path);
        System.out.println("[JWT-FILTER] Authorization header = " + authHeader);

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            boolean valid = jwtProvider.validateToken(token);
            System.out.println("[JWT-FILTER] token valid = " + valid);

            if (valid) {
                Long userId = jwtProvider.getUserId(token);
                System.out.println("[JWT-FILTER] parsed userId = " + userId);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userId,
                                null,
                                Collections.emptyList()
                        );

                authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                SecurityContextHolder.getContext().setAuthentication(authentication);

                System.out.println("[JWT-FILTER] SecurityContext principal = "
                        + SecurityContextHolder.getContext().getAuthentication().getPrincipal());
            }
        } else {
            System.out.println("[JWT-FILTER] No Bearer token");
        }

        filterChain.doFilter(request, response);
    }
}