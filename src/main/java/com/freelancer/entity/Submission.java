package com.freelancer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name="submissions")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Submission {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    private Long milestoneId;
    private Long projectId;
    private Long freelancerId;

    @Column(length=2000) private String description;
    private String externalLink;        // GitHub, Drive, Figma etc.
    private String fileName;            // uploaded file name
    private String fileType;
    @Lob @Column(columnDefinition="LONGBLOB")
    private byte[] fileData;            // actual file bytes stored in DB

    private int revisionRound;          // 0 = initial, 1 = 1st revision...
    // SUBMITTED, REVISION_REQUESTED, APPROVED, REJECTED
    private String status = "SUBMITTED";
    @Column(length=1000) private String clientNote; // feedback/revision note from client
    private LocalDateTime submittedAt = LocalDateTime.now();
    private LocalDateTime reviewedAt;
}
