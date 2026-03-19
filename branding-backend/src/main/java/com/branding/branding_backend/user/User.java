package com.branding.branding_backend.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor

public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Column(name = "user_name", nullable = false, length = 11)
    private String username;

    @Column(name = "mobile_number", length = 11)
    private String mobileNumber;

    @Column(nullable = false, length = 50, unique = true)
    private String email;

    @Column(nullable = false, length = 50, unique = true)
    private String loginId;

    @Column(nullable = false, length = 100)
    private String password;

    @Column(name = "user_created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    private void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.role == null) {
            this.role = UserRole.USER;
        }
    }

    public User(
            String loginId,
            String email,
            String password,
            String mobileNumber,
            String username
    ) {
        this.loginId = loginId;
        this.email = email;
        this.password = password;
        this.mobileNumber = mobileNumber;
        this.username = username;
    }
}
