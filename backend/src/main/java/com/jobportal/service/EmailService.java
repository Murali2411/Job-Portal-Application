package com.jobportal.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender emailSender;

    public void sendPasswordResetEmail(String to, String resetToken) {
        try {
            if (emailSender != null) {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom("noreply@jobportal.com");
                message.setTo(to);
                message.setSubject("Password Reset Request");
                message.setText("Click the link below to reset your password:\n" +
                        "http://localhost:3000/reset-password?token=" + resetToken);
                emailSender.send(message);
            } else {
                // Log that email service is not configured
                System.out.println("Email would be sent to: " + to + " with token: " + resetToken);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }

    public void sendApplicationNotification(String recruiterEmail, String candidateName, String jobTitle) {
        try {
            if (emailSender != null) {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom("noreply@jobportal.com");
                message.setTo(recruiterEmail);
                message.setSubject("New Job Application Received");
                message.setText("You have received a new application from " + candidateName + 
                               " for the position: " + jobTitle);
                emailSender.send(message);
            }
        } catch (Exception e) {
            System.err.println("Failed to send application notification: " + e.getMessage());
        }
    }

    public void sendApplicationStatusUpdate(String candidateEmail, String jobTitle, String status) {
        try {
            if (emailSender != null) {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom("noreply@jobportal.com");
                message.setTo(candidateEmail);
                message.setSubject("Application Status Update");
                message.setText("Your application for " + jobTitle + " has been " + status.toLowerCase());
                emailSender.send(message);
            }
        } catch (Exception e) {
            System.err.println("Failed to send status update: " + e.getMessage());
        }
    }

    public void sendAccountStatusUpdate(String email, String status) {
        try {
            if (emailSender != null) {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom("noreply@jobportal.com");
                message.setTo(email);
                message.setSubject("Account Status Update");
                message.setText("Your account has been " + status + ".");
                emailSender.send(message);
            }
        } catch (Exception e) {
            System.err.println("Failed to send account status update: " + e.getMessage());
        }
    }

    public void sendJobApprovalNotification(String recruiterEmail, String jobTitle, String status) {
        try {
            if (emailSender != null) {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom("noreply@jobportal.com");
                message.setTo(recruiterEmail);
                message.setSubject("Job Posting " + status.toUpperCase());
                message.setText("Your job posting '" + jobTitle + "' has been " + status + ".");
                emailSender.send(message);
            }
        } catch (Exception e) {
            System.err.println("Failed to send job approval notification: " + e.getMessage());
        }
    }

    public void sendJobRejectionNotification(String recruiterEmail, String jobTitle, String reason) {
        try {
            if (emailSender != null) {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom("noreply@jobportal.com");
                message.setTo(recruiterEmail);
                message.setSubject("Job Posting Rejected");
                String text = "Your job posting '" + jobTitle + "' has been rejected.";
                if (reason != null && !reason.trim().isEmpty()) {
                    text += "\n\nReason: " + reason;
                }
                message.setText(text);
                emailSender.send(message);
            }
        } catch (Exception e) {
            System.err.println("Failed to send job rejection notification: " + e.getMessage());
        }
    }

    public void sendWelcomeEmail(String email, String name, String role) {
        try {
            if (emailSender != null) {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom("noreply@jobportal.com");
                message.setTo(email);
                message.setSubject("Welcome to Job Portal");
                message.setText("Welcome " + name + "!\n\n" +
                               "Thank you for registering as a " + role.toLowerCase() + " on our Job Portal.\n" +
                               "Start exploring opportunities and connecting with the right people.\n\n" +
                               "Best regards,\nJob Portal Team");
                emailSender.send(message);
            }
        } catch (Exception e) {
            System.err.println("Failed to send welcome email: " + e.getMessage());
        }
    }
}