package com.branding.branding_backend.branding.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "brand_state_context",
        indexes = {
        @Index(name = "idx_brand_step_active",
                columnList = "brand_id, step, is_active")
        })
@Getter
@Setter
@NoArgsConstructor
public class BrandStateContext {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "state_id")
    private Long stateId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @Enumerated(EnumType.STRING)
    @Column(name = "step", nullable = false)
    private CurrentStep step;

    @Column(name = "version", nullable = false)
    private Integer version;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "state_context", columnDefinition = "TEXT", nullable = false)
    private String stateContext;

    @Column(name = "state_created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
