package com.jobportal.dto;

import com.jobportal.enums.JobType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class JobRequest {
    
    @NotBlank(message = "Job title is required")
    private String title;
    
    @NotBlank(message = "Job description is required")
    private String description;
    
    @NotBlank(message = "Company name is required")
    private String company;
    
    private String location;
    
    @NotNull(message = "Job type is required")
    private JobType jobType;
    
    private BigDecimal minSalary;
    private BigDecimal maxSalary;
    private String requirements;
    private String benefits;
    private String skills;
    private String experience;
    private String education;
    private LocalDateTime applicationDeadline;
}