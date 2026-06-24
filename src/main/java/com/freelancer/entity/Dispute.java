package com.freelancer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name="disputes")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Dispute {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    private Long projectId;
    private Long raisedById;
    @Column(length=2000) private String reason;
    // OPEN, RESOLVED_CLIENT, RESOLVED_FREELANCER, CLOSED
    private String status = "OPEN";
    @Column(length=1000) private String adminNote;
    private Long resolvedBy;
    private LocalDateTime raisedAt = LocalDateTime.now();
    private LocalDateTime resolvedAt;
}
