package com.freelancer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name="milestones")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Milestone {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    private Long projectId;
    private String title;
    @Column(length=1000) private String description;
    private double amount;
    private int orderNum;
    // PENDING, SUBMITTED, REVISION_REQUESTED, APPROVED, PAID
    private String status = "PENDING";
    private LocalDateTime createdAt = LocalDateTime.now();
}
