package com.freelancer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name="transactions")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Transaction {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    private Long fromId;
    private Long toId;
    private double amount;
    private String note;
    private LocalDateTime createdAt = LocalDateTime.now();
}
