package com.branding.branding_backend.auth;

import lombok.Getter;

@Getter
public class RegisterRequest {
    private String loginId;
    private String email;
    private String password;
    private String mobileNumber;
    private String username;
}
