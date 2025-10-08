package com.jobportal.controller;

import com.jobportal.dto.DashboardStats;
import com.jobportal.dto.UserResponse;
import com.jobportal.service.AdminService;
import com.jobportal.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStats> getDashboardStats() {
        DashboardStats stats = dashboardService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String keyword) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<UserResponse> users = adminService.getAllUsers(role, keyword, pageable);
        return ResponseEntity.ok(users);
    }

    @PutMapping("/users/{id}/activate")
    public ResponseEntity<?> activateUser(@PathVariable Long id) {
        adminService.toggleUserStatus(id, true);
        return ResponseEntity.ok("User activated successfully");
    }

    @PutMapping("/users/{id}/deactivate")
    public ResponseEntity<?> deactivateUser(@PathVariable Long id) {
        adminService.toggleUserStatus(id, false);
        return ResponseEntity.ok("User deactivated successfully");
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok("User deleted successfully");
    }

    @GetMapping("/jobs/pending")
    public ResponseEntity<Page<com.jobportal.dto.JobResponse>> getPendingJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<com.jobportal.dto.JobResponse> jobs = adminService.getPendingJobs(pageable);
        return ResponseEntity.ok(jobs);
    }

    @PostMapping("/jobs/{id}/approve")
    public ResponseEntity<?> approveJob(@PathVariable Long id) {
        adminService.approveJob(id);
        return ResponseEntity.ok("Job approved successfully");
    }

    @PostMapping("/jobs/{id}/reject")
    public ResponseEntity<?> rejectJob(@PathVariable Long id, @RequestParam(required = false) String reason) {
        adminService.rejectJob(id, reason);
        return ResponseEntity.ok("Job rejected successfully");
    }

    @GetMapping("/analytics/user-growth")
    public ResponseEntity<?> getUserGrowthAnalytics() {
        return ResponseEntity.ok(dashboardService.getUserGrowthData());
    }

    @GetMapping("/analytics/job-trends")
    public ResponseEntity<?> getJobTrends() {
        return ResponseEntity.ok(dashboardService.getJobTrendsData());
    }

    @GetMapping("/analytics/application-stats")
    public ResponseEntity<?> getApplicationStats() {
        return ResponseEntity.ok(dashboardService.getApplicationStatsData());
    }
}