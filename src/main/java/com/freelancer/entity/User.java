package com.freelancer.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name="users")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    private String name;
    @Column(unique=true) private String email;
    private String password;
    private String role; // CLIENT, FREELANCER, ADMIN
    private double wallet;
    private String skills;
    @Column(length=1000) private String bio;
    @Lob @Column(columnDefinition="LONGTEXT") private String avatar; // base64 data URL
    private boolean active = true;
}
