package com.freelancer.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name="bids")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Bid {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    private Long projectId;
    private Long freelancerId;
    private double amount;
}
