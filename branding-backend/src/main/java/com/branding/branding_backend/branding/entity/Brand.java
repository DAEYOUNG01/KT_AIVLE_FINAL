package com.branding.branding_backend.branding.entity;

import com.branding.branding_backend.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "brands")
@Getter
@Setter
@NoArgsConstructor
public class Brand {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "brand_id")
    private Long brandId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_step", length = 30)
    private CurrentStep currentStep;

    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // 컨설팅 로직
    public void moveToNaming() {
        this.currentStep = CurrentStep.NAMING;
    }

    public void moveToConcept() {
        this.currentStep = CurrentStep.CONCEPT;
    }

    public void moveToStory() {
        this.currentStep = CurrentStep.STORY;
    }

    public void moveToLogo() {
        this.currentStep = CurrentStep.LOGO;
    }

    public void moveToFinal() {
        this.currentStep = CurrentStep.FINAL;
    }

}