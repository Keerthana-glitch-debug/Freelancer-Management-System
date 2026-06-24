package com.freelancer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name="messages")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Message {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    private Long projectId;
    private Long senderId;
    private Long receiverId;
    @Column(length=2000) private String content;
    private boolean read = false;
    private LocalDateTime sentAt = LocalDateTime.now();
}
