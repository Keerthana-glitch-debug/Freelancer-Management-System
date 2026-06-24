package com.freelancer.repository;
import com.freelancer.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface SubmissionRepo extends JpaRepository<Submission, Long> {
    List<Submission> findByMilestoneIdOrderBySubmittedAtDesc(Long milestoneId);
    List<Submission> findByProjectIdOrderBySubmittedAtDesc(Long projectId);
    List<Submission> findByFreelancerIdOrderBySubmittedAtDesc(Long freelancerId);
}
