package com.freelancer.repository;
import com.freelancer.entity.Bid;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface BidRepo extends JpaRepository<Bid, Long> {
    List<Bid> findByProjectId(Long projectId);
    Optional<Bid> findByProjectIdAndFreelancerId(Long projectId, Long freelancerId);
    List<Bid> findByFreelancerId(Long freelancerId);
}
