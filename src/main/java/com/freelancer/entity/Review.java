package com.freelancer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name="reviews")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Review {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    private Long freelancerId;
    private Long clientId;
    private Long projectId;
    private int rating;
    @Column(length=1000) private String comment;
    private LocalDateTime createdAt = LocalDateTime.now();
}
