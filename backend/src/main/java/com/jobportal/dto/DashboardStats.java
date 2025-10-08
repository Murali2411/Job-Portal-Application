package com.jobportal.dto;

import lombok.Data;

@Data
public class DashboardStats {
    private long totalUsers;
    private long totalCandidates;
    private long totalRecruiters;
    private long totalJobs;
    private long activeJobs;
    private long pendingJobs;
    private long totalApplications;
    private long pendingApplications;
    private long shortlistedApplications;
    private long acceptedApplications;
    private long totalApplicationsReceived;
}