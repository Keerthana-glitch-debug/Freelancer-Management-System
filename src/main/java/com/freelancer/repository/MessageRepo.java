package com.freelancer.repository;
import com.freelancer.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface MessageRepo extends JpaRepository<Message, Long> {
    List<Message> findByProjectIdOrderBySentAt(Long projectId);
    List<Message> findByReceiverIdAndReadFalse(Long receiverId);
    long countByReceiverIdAndReadFalse(Long receiverId);
}
