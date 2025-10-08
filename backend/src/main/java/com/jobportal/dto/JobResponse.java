package com.jobportal.dto;

import com.jobportal.enums.JobStatus;
import com.jobportal.enums.JobType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class JobResponse {
    private Long jobId;
    private String title;
    private String description;
    private String company;
    private String location;
    private JobType jobType;
    private BigDecimal minSalary;
    private BigDecimal maxSalary;
    private String requirements;
    private String benefits;
    private String skills;
    private String experience;
    private String education;
    private LocalDateTime applicationDeadline;
    private JobStatus status;
    private LocalDateTime createdAt;
    private String recruiterName;
    private String recruiterEmail;
    private Double matchScore; // For AI recommendations
}