package com.branding.branding_backend.branding.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "brand_output",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"brand_id", "output_type"})
        }
)
@Getter
@Setter
@NoArgsConstructor
public class BrandOutput {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "brand_output_id")
    private Long brandOutputId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id",  nullable = false)
    private Brand brand;

    @Enumerated(EnumType.STRING)
    @Column(name = "output_type", nullable = false)
    private OutputType outputType;

    @Column(name = "brand_content", columnDefinition = "TEXT")
    private String brandContent;
}
