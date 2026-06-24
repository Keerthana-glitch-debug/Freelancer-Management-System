package com.freelancer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name="contracts")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Contract {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    private Long projectId;
    private Long clientId;
    private Long freelancerId;
    @Column(length=4000) private String terms;
    private double totalAmount;
    private int revisionLimit;          // max revision rounds allowed
    // PENDING_FREELANCER, ACTIVE, COMPLETED, DISPUTED, CANCELLED
    private String status = "PENDING_FREELANCER";
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime agreedAt;
}
