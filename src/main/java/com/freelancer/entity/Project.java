package com.freelancer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name="projects")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Project {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    private String title;
    @Column(length=2000) private String description;
    private double budget;
    private String status = "OPEN"; // OPEN,ASSIGNED,IN_PROGRESS,COMPLETED,PAID
    private Long clientId;
    private Long assignedId;
    private LocalDateTime createdAt = LocalDateTime.now();
}
