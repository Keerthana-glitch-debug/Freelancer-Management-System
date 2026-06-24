package com.freelancer.repository;
import com.freelancer.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface TransactionRepo extends JpaRepository<Transaction, Long> {
    List<Transaction> findByFromIdOrToId(Long from, Long to);
}
