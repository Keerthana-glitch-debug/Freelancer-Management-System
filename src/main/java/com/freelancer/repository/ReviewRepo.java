package com.freelancer.repository;
import com.freelancer.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface ReviewRepo extends JpaRepository<Review, Long> {
    List<Review> findByFreelancerId(Long freelancerId);
}
