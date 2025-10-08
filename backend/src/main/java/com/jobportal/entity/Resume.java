package com.jobportal.entity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
@Entity
@Table(name = "resumes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Resume {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "resume_id")
    private Long resumeId;
    
    @Column(nullable = false, length = 200)
    private String fileName;
    
    @Column(nullable = false, length = 500)
    private String filePath;
    
    @Column(name = "file_size")
    private Long fileSize;
    
    @Column(name = "file_type", length = 50)
    private String fileType;
    
    @Column(name = "is_primary")
    private Boolean isPrimary = false;
    
    @Column(columnDefinition = "TEXT")
    private String extractedText; // For AI processing
    
    @Column(columnDefinition = "TEXT")
    private String skills; // Extracted skills
    
    @Column(columnDefinition = "TEXT")
    private String experience; // Extracted experience
    
    @Column(columnDefinition = "TEXT")
    private String education; // Extracted education
    
    @CreationTimestamp
    @Column(name = "upload_date")
    private LocalDateTime uploadDate;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}