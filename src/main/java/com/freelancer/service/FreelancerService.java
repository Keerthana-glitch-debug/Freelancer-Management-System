package com.freelancer.service;

import com.freelancer.entity.*;
import com.freelancer.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class FreelancerService {

    @Autowired UserRepo userRepo;
    @Autowired ProjectRepo projectRepo;
    @Autowired BidRepo bidRepo;
    @Autowired ReviewRepo reviewRepo;
    @Autowired TransactionRepo transactionRepo;
    @Autowired MilestoneRepo milestoneRepo;
    @Autowired SubmissionRepo submissionRepo;
    @Autowired ContractRepo contractRepo;
    @Autowired MessageRepo messageRepo;
    @Autowired DisputeRepo disputeRepo;

    @PostConstruct
    public void seed() {
        if (userRepo.count() == 0) {
            userRepo.save(User.builder().name("Admin").email("admin@example.com")
                .password("Admin123").role("ADMIN").wallet(0).active(true).build());
        }
    }

    public User register(String name, String email, String password, String role, double wallet, String skills, String bio) {
        if (userRepo.findByEmailIgnoreCase(email).isPresent()) throw new RuntimeException("Email already registered.");
        return userRepo.save(User.builder().name(name).email(email).password(password)
            .role(role).wallet(wallet).skills(skills).bio(bio).active(true).build());
    }

    public User login(String email, String password) {
        User u = userRepo.findByEmailIgnoreCase(email).orElseThrow(() -> new RuntimeException("Invalid credentials."));
        if (!u.getPassword().equals(password)) throw new RuntimeException("Invalid credentials.");
        if (!u.isActive()) throw new RuntimeException("Account is deactivated.");
        return u;
    }

    public List<User> getAllUsers() { return userRepo.findAll(); }
    public List<User> getFreelancers() { return userRepo.findByRole("FREELANCER"); }
    public User getUser(Long id) { return userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found.")); }
    public void toggleUser(Long id) { User u = getUser(id); u.setActive(!u.isActive()); userRepo.save(u); }
    public User updateProfile(Long id, String skills, String bio) {
        User u = getUser(id);
        if (skills != null && !skills.isBlank()) u.setSkills(skills);
        if (bio != null && !bio.isBlank()) u.setBio(bio);
        return userRepo.save(u);
    }
    public User updateAvatar(Long id, String avatarBase64) {
        User u = getUser(id);
        u.setAvatar(avatarBase64);
        return userRepo.save(u);
    }

    public Project postProject(String title, String desc, double budget, Long clientId) {
        if (budget <= 0) throw new RuntimeException("Budget must be positive.");
        return projectRepo.save(Project.builder().title(title).description(desc).budget(budget).clientId(clientId).status("OPEN").build());
    }
    public List<Project> getOpenProjects() { return projectRepo.findByStatus("OPEN"); }
    public List<Project> getProjectsByStatus(String s) { return projectRepo.findByStatus(s); }
    public List<Project> getClientProjects(Long id) { return projectRepo.findByClientId(id); }
    public List<Project> searchProjects(String kw) { return projectRepo.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(kw, kw); }
    public List<Project> filterByBudget(double min, double max) { return projectRepo.findByBudgetBetween(min, max); }
    public List<Project> getAllProjects() { return projectRepo.findAll(); }
    public Project getProject(Long id) { return projectRepo.findById(id).orElseThrow(() -> new RuntimeException("Project not found.")); }

    public void placeBid(Long projectId, Long freelancerId, double amount) {
        Project p = getProject(projectId);
        if (!"OPEN".equals(p.getStatus())) throw new RuntimeException("Project is not open for bids.");
        Bid bid = bidRepo.findByProjectIdAndFreelancerId(projectId, freelancerId)
            .orElse(Bid.builder().projectId(projectId).freelancerId(freelancerId).build());
        bid.setAmount(amount);
        bidRepo.save(bid);
    }
    public List<Bid> getBids(Long projectId) { return bidRepo.findByProjectId(projectId); }
    public List<Bid> getFreelancerBids(Long freelancerId) { return bidRepo.findByFreelancerId(freelancerId); }

    public Contract createContract(Long projectId, Long freelancerId, Long clientId, String terms, int revisionLimit) {
        Project p = getProject(projectId);
        if (!p.getClientId().equals(clientId)) throw new RuntimeException("Not your project.");
        bidRepo.findByProjectIdAndFreelancerId(projectId, freelancerId)
            .orElseThrow(() -> new RuntimeException("Freelancer did not bid."));
        if (contractRepo.findByProjectId(projectId).isPresent())
            throw new RuntimeException("Contract already exists.");
        p.setAssignedId(freelancerId);
        p.setStatus("CONTRACT_SENT");
        projectRepo.save(p);
        return contractRepo.save(Contract.builder()
            .projectId(projectId).clientId(clientId).freelancerId(freelancerId)
            .terms(terms).totalAmount(p.getBudget()).revisionLimit(revisionLimit)
            .status("PENDING_FREELANCER").build());
    }

    public Contract agreeContract(Long contractId, Long freelancerId) {
        Contract c = contractRepo.findById(contractId).orElseThrow(() -> new RuntimeException("Contract not found."));
        if (!c.getFreelancerId().equals(freelancerId)) throw new RuntimeException("Not your contract.");
        if (!"PENDING_FREELANCER".equals(c.getStatus())) throw new RuntimeException("Already processed.");
        c.setStatus("ACTIVE"); c.setAgreedAt(LocalDateTime.now()); contractRepo.save(c);
        Project p = getProject(c.getProjectId());
        p.setStatus("IN_PROGRESS"); projectRepo.save(p);
        return c;
    }
    public Optional<Contract> getContractByProject(Long projectId) { return contractRepo.findByProjectId(projectId); }
    public List<Contract> getFreelancerContracts(Long fid) { return contractRepo.findByFreelancerId(fid); }
    public List<Contract> getAllContracts() { return contractRepo.findAll(); }

    public Milestone addMilestone(Long projectId, Long clientId, String title, String desc, double amount, int order) {
        Project p = getProject(projectId);
        if (!p.getClientId().equals(clientId)) throw new RuntimeException("Not your project.");
        return milestoneRepo.save(Milestone.builder()
            .projectId(projectId).title(title).description(desc).amount(amount).orderNum(order).status("PENDING").build());
    }
    public List<Milestone> getMilestones(Long projectId) { return milestoneRepo.findByProjectIdOrderByOrderNum(projectId); }

    public Submission submitWork(Long milestoneId, Long projectId, Long freelancerId,
                                  String description, String link, String fileName, String fileType, byte[] fileData) {
        Project p = getProject(projectId);
        if (!freelancerId.equals(p.getAssignedId())) throw new RuntimeException("Not assigned to this project.");
        Milestone m = milestoneRepo.findById(milestoneId).orElseThrow(() -> new RuntimeException("Milestone not found."));
        if ("APPROVED".equals(m.getStatus()) || "PAID".equals(m.getStatus())) throw new RuntimeException("Milestone already approved.");
        long prevCount = submissionRepo.findByMilestoneIdOrderBySubmittedAtDesc(milestoneId).size();
        Contract contract = contractRepo.findByProjectId(projectId).orElse(null);
        if (contract != null && prevCount >= contract.getRevisionLimit() + 1)
            throw new RuntimeException("Revision limit (" + contract.getRevisionLimit() + ") exceeded.");
        Submission sub = submissionRepo.save(Submission.builder()
            .milestoneId(milestoneId).projectId(projectId).freelancerId(freelancerId)
            .description(description).externalLink(link)
            .fileName(fileName).fileType(fileType).fileData(fileData)
            .revisionRound((int) prevCount).status("SUBMITTED").build());
        m.setStatus("SUBMITTED"); milestoneRepo.save(m);
        return sub;
    }

    public List<Submission> getMilestoneSubmissions(Long milestoneId) { return submissionRepo.findByMilestoneIdOrderBySubmittedAtDesc(milestoneId); }
    public List<Submission> getProjectSubmissions(Long projectId) { return submissionRepo.findByProjectIdOrderBySubmittedAtDesc(projectId); }
    public List<Submission> getFreelancerSubmissions(Long freelancerId) { return submissionRepo.findByFreelancerIdOrderBySubmittedAtDesc(freelancerId); }
    public Submission getSubmission(Long id) { return submissionRepo.findById(id).orElseThrow(() -> new RuntimeException("Submission not found.")); }

    public Submission reviewSubmission(Long submissionId, Long clientId, String action, String note) {
        Submission sub = getSubmission(submissionId);
        Project p = getProject(sub.getProjectId());
        if (!p.getClientId().equals(clientId)) throw new RuntimeException("Not your project.");
        Milestone m = milestoneRepo.findById(sub.getMilestoneId()).orElseThrow(() -> new RuntimeException("Milestone not found."));
        sub.setClientNote(note); sub.setReviewedAt(LocalDateTime.now());
        if ("APPROVE".equals(action)) {
            sub.setStatus("APPROVED"); m.setStatus("APPROVED"); milestoneRepo.save(m);
            List<Milestone> all = milestoneRepo.findByProjectIdOrderByOrderNum(p.getId());
            if (all.stream().allMatch(ms -> "APPROVED".equals(ms.getStatus()) || "PAID".equals(ms.getStatus())))
                { p.setStatus("COMPLETED"); projectRepo.save(p); }
        } else {
            sub.setStatus("REVISION_REQUESTED"); m.setStatus("REVISION_REQUESTED"); milestoneRepo.save(m);
        }
        return submissionRepo.save(sub);
    }

    public Transaction payMilestone(Long milestoneId, Long clientId) {
        Milestone m = milestoneRepo.findById(milestoneId).orElseThrow(() -> new RuntimeException("Milestone not found."));
        if (!"APPROVED".equals(m.getStatus())) throw new RuntimeException("Milestone must be APPROVED.");
        Project p = getProject(m.getProjectId());
        if (!p.getClientId().equals(clientId)) throw new RuntimeException("Not your project.");
        User client = getUser(clientId); User freelancer = getUser(p.getAssignedId());
        if (client.getWallet() < m.getAmount()) throw new RuntimeException("Insufficient wallet balance.");
        client.setWallet(client.getWallet() - m.getAmount());
        freelancer.setWallet(freelancer.getWallet() + m.getAmount());
        userRepo.save(client); userRepo.save(freelancer);
        m.setStatus("PAID"); milestoneRepo.save(m);
        Transaction t = transactionRepo.save(Transaction.builder().fromId(clientId).toId(freelancer.getId())
            .amount(m.getAmount()).note("Milestone: " + m.getTitle() + " (Project #" + p.getId() + ")").build());
        List<Milestone> all = milestoneRepo.findByProjectIdOrderByOrderNum(p.getId());
        if (all.stream().allMatch(ms -> "PAID".equals(ms.getStatus()))) { p.setStatus("PAID"); projectRepo.save(p); }
        return t;
    }

    public Transaction payProject(Long projectId, Long clientId) {
        Project p = getProject(projectId);
        if (!p.getClientId().equals(clientId)) throw new RuntimeException("Not your project.");
        if (!"COMPLETED".equals(p.getStatus())) throw new RuntimeException("Project must be COMPLETED.");
        User client = getUser(clientId); User freelancer = getUser(p.getAssignedId());
        if (client.getWallet() < p.getBudget()) throw new RuntimeException("Insufficient balance.");
        client.setWallet(client.getWallet() - p.getBudget());
        freelancer.setWallet(freelancer.getWallet() + p.getBudget());
        userRepo.save(client); userRepo.save(freelancer);
        p.setStatus("PAID"); projectRepo.save(p);
        return transactionRepo.save(Transaction.builder().fromId(clientId).toId(freelancer.getId())
            .amount(p.getBudget()).note("Full payment for project #" + p.getId()).build());
    }

    public Message sendMessage(Long projectId, Long senderId, Long receiverId, String content) {
        return messageRepo.save(Message.builder().projectId(projectId).senderId(senderId)
            .receiverId(receiverId).content(content).read(false).build());
    }
    public List<Message> getProjectMessages(Long projectId) { return messageRepo.findByProjectIdOrderBySentAt(projectId); }
    public long getUnreadCount(Long userId) { return messageRepo.countByReceiverIdAndReadFalse(userId); }
    public void markRead(Long projectId, Long userId) {
        messageRepo.findByProjectIdOrderBySentAt(projectId).stream()
            .filter(m -> m.getReceiverId().equals(userId) && !m.isRead())
            .forEach(m -> { m.setRead(true); messageRepo.save(m); });
    }

    public Dispute raiseDispute(Long projectId, Long raisedById, String reason) {
        if (disputeRepo.findByProjectIdAndStatus(projectId, "OPEN").isPresent())
            throw new RuntimeException("Open dispute already exists.");
        Project p = getProject(projectId); p.setStatus("DISPUTED"); projectRepo.save(p);
        return disputeRepo.save(Dispute.builder().projectId(projectId).raisedById(raisedById).reason(reason).status("OPEN").build());
    }
    public List<Dispute> getOpenDisputes() { return disputeRepo.findByStatus("OPEN"); }
    public List<Dispute> getAllDisputes() { return disputeRepo.findAll(); }
    public Dispute resolveDispute(Long disputeId, Long adminId, String resolution, String note) {
        Dispute d = disputeRepo.findById(disputeId).orElseThrow(() -> new RuntimeException("Dispute not found."));
        d.setStatus(resolution); d.setAdminNote(note); d.setResolvedBy(adminId); d.setResolvedAt(LocalDateTime.now());
        disputeRepo.save(d);
        Project p = getProject(d.getProjectId());
        if ("RESOLVED_FREELANCER".equals(resolution)) p.setStatus("COMPLETED");
        else p.setStatus("CANCELLED");
        projectRepo.save(p);
        return d;
    }

    public void leaveReview(Long projectId, Long clientId, int rating, String comment) {
        Project p = getProject(projectId);
        if (!p.getClientId().equals(clientId)) throw new RuntimeException("Not your project.");
        reviewRepo.save(Review.builder().freelancerId(p.getAssignedId()).clientId(clientId)
            .projectId(projectId).rating(rating).comment(comment).build());
    }
    public List<Review> getFreelancerReviews(Long fid) { return reviewRepo.findByFreelancerId(fid); }
    public List<Review> getAllReviews() { return reviewRepo.findAll(); }
    public double avgRating(Long fid) {
        return reviewRepo.findByFreelancerId(fid).stream().mapToInt(Review::getRating).average().orElse(0);
    }

    public List<Transaction> getUserTransactions(Long userId) { return transactionRepo.findByFromIdOrToId(userId, userId); }
    public List<Transaction> getAllTransactions() { return transactionRepo.findAll(); }
}
