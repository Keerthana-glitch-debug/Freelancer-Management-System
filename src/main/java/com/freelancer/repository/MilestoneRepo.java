package com.freelancer.repository;
import com.freelancer.entity.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface MilestoneRepo extends JpaRepository<Milestone, Long> {
    List<Milestone> findByProjectIdOrderByOrderNum(Long projectId);
}
