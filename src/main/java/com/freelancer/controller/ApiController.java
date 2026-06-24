package com.freelancer.controller;

import com.freelancer.entity.*;
import com.freelancer.service.FreelancerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api")
public class ApiController {

    @Autowired FreelancerService svc;

    record R(boolean ok, Object data) {}
    static R ok(Object d) { return new R(true, d); }
    static R err(String m) { return new R(false, m); }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<R> ex(RuntimeException e) {
        return ResponseEntity.badRequest().body(err(e.getMessage()));
    }

    // AUTH
    @PostMapping("/register")
    public R register(@RequestBody Map<String,String> b) {
        return ok(svc.register(b.get("name"), b.get("email"), b.get("password"),
            b.get("role"), Double.parseDouble(b.getOrDefault("wallet","0")),
            b.getOrDefault("skills",""), b.getOrDefault("bio","")));
    }
    @PostMapping("/login")
    public R login(@RequestBody Map<String,String> b) { return ok(svc.login(b.get("email"), b.get("password"))); }

    // USERS
    @GetMapping("/users") public R users() { return ok(svc.getAllUsers()); }
    @GetMapping("/users/{id}") public R user(@PathVariable Long id) { return ok(svc.getUser(id)); }
    @GetMapping("/freelancers") public R freelancers() { return ok(svc.getFreelancers()); }
    @PostMapping("/users/{id}/toggle") public R toggleUser(@PathVariable Long id) { svc.toggleUser(id); return ok("Done"); }
    @PutMapping("/users/{id}/profile")
    public R updateProfile(@PathVariable Long id, @RequestBody Map<String,String> b) {
        return ok(svc.updateProfile(id, b.get("skills"), b.get("bio")));
    }
    @PutMapping("/users/{id}/avatar")
    public R updateAvatar(@PathVariable Long id, @RequestBody Map<String,String> b) {
        return ok(svc.updateAvatar(id, b.get("avatar")));
    }
    @GetMapping("/users/{id}/unread")
    public R unread(@PathVariable Long id) { return ok(Map.of("count", svc.getUnreadCount(id))); }

    // PROJECTS
    @PostMapping("/projects")
    public R postProject(@RequestBody Map<String,String> b) {
        return ok(svc.postProject(b.get("title"), b.get("description"),
            Double.parseDouble(b.get("budget")), Long.parseLong(b.get("clientId"))));
    }
    @GetMapping("/projects") public R allProjects() { return ok(svc.getAllProjects()); }
    @GetMapping("/projects/open") public R openProjects() { return ok(svc.getOpenProjects()); }
    @GetMapping("/projects/status/{s}") public R byStatus(@PathVariable String s) { return ok(svc.getProjectsByStatus(s)); }
    @GetMapping("/projects/client/{id}") public R clientProjects(@PathVariable Long id) { return ok(svc.getClientProjects(id)); }
    @GetMapping("/projects/search") public R search(@RequestParam String kw) { return ok(svc.searchProjects(kw)); }
    @GetMapping("/projects/budget") public R budget(@RequestParam double min, @RequestParam double max) { return ok(svc.filterByBudget(min, max)); }
    @GetMapping("/projects/{id}") public R project(@PathVariable Long id) { return ok(svc.getProject(id)); }
    @GetMapping("/projects/{id}/bids") public R bids(@PathVariable Long id) { return ok(svc.getBids(id)); }
    @GetMapping("/freelancers/{id}/bids") public R freelancerBids(@PathVariable Long id) { return ok(svc.getFreelancerBids(id)); }

    @PostMapping("/projects/{id}/bid")
    public R bid(@PathVariable Long id, @RequestBody Map<String,String> b) {
        svc.placeBid(id, Long.parseLong(b.get("freelancerId")), Double.parseDouble(b.get("amount")));
        return ok("Bid placed.");
    }

    // CONTRACT
    @PostMapping("/projects/{id}/contract")
    public R createContract(@PathVariable Long id, @RequestBody Map<String,String> b) {
        return ok(svc.createContract(id, Long.parseLong(b.get("freelancerId")),
            Long.parseLong(b.get("clientId")), b.get("terms"),
            Integer.parseInt(b.getOrDefault("revisionLimit","3"))));
    }
    @GetMapping("/projects/{id}/contract")
    public R getContract(@PathVariable Long id) {
        return ok(svc.getContractByProject(id).orElse(null));
    }
    @PostMapping("/contracts/{id}/agree")
    public R agreeContract(@PathVariable Long id, @RequestBody Map<String,String> b) {
        return ok(svc.agreeContract(id, Long.parseLong(b.get("freelancerId"))));
    }
    @GetMapping("/freelancers/{id}/contracts")
    public R freelancerContracts(@PathVariable Long id) { return ok(svc.getFreelancerContracts(id)); }

    // MILESTONES
    @PostMapping("/projects/{id}/milestones")
    public R addMilestone(@PathVariable Long id, @RequestBody Map<String,String> b) {
        return ok(svc.addMilestone(id, Long.parseLong(b.get("clientId")),
            b.get("title"), b.get("description"),
            Double.parseDouble(b.get("amount")), Integer.parseInt(b.getOrDefault("order","1"))));
    }
    @GetMapping("/projects/{id}/milestones")
    public R getMilestones(@PathVariable Long id) { return ok(svc.getMilestones(id)); }

    // SUBMISSIONS
    @PostMapping("/milestones/{mid}/submit")
    public R submit(@PathVariable Long mid, @RequestBody Map<String,String> b) {
        return ok(svc.submitWork(mid, Long.parseLong(b.get("projectId")),
            Long.parseLong(b.get("freelancerId")),
            b.get("description"), b.getOrDefault("link",""),
            null, null, null));
    }
    @GetMapping("/milestones/{mid}/submissions")
    public R milestoneSubmissions(@PathVariable Long mid) { return ok(svc.getMilestoneSubmissions(mid)); }
    @GetMapping("/projects/{id}/submissions")
    public R projectSubmissions(@PathVariable Long id) { return ok(svc.getProjectSubmissions(id)); }
    @GetMapping("/freelancers/{id}/submissions")
    public R freelancerSubmissions(@PathVariable Long id) { return ok(svc.getFreelancerSubmissions(id)); }

    @PostMapping("/submissions/{id}/review")
    public R reviewSubmission(@PathVariable Long id, @RequestBody Map<String,String> b) {
        return ok(svc.reviewSubmission(id, Long.parseLong(b.get("clientId")), b.get("action"), b.getOrDefault("note","")));
    }

    // PAY
    @PostMapping("/milestones/{id}/pay")
    public R payMilestone(@PathVariable Long id, @RequestBody Map<String,String> b) {
        return ok(svc.payMilestone(id, Long.parseLong(b.get("clientId"))));
    }
    @PostMapping("/projects/{id}/pay")
    public R payProject(@PathVariable Long id, @RequestBody Map<String,String> b) {
        return ok(svc.payProject(id, Long.parseLong(b.get("clientId"))));
    }

    // MESSAGES
    @PostMapping("/projects/{id}/messages")
    public R sendMsg(@PathVariable Long id, @RequestBody Map<String,String> b) {
        return ok(svc.sendMessage(id, Long.parseLong(b.get("senderId")),
            Long.parseLong(b.get("receiverId")), b.get("content")));
    }
    @GetMapping("/projects/{id}/messages")
    public R getMessages(@PathVariable Long id) { return ok(svc.getProjectMessages(id)); }
    @PostMapping("/projects/{id}/messages/read")
    public R markRead(@PathVariable Long id, @RequestBody Map<String,String> b) {
        svc.markRead(id, Long.parseLong(b.get("userId"))); return ok("Done");
    }

    // DISPUTES
    @PostMapping("/projects/{id}/dispute")
    public R raiseDispute(@PathVariable Long id, @RequestBody Map<String,String> b) {
        return ok(svc.raiseDispute(id, Long.parseLong(b.get("raisedById")), b.get("reason")));
    }
    @GetMapping("/disputes") public R disputes() { return ok(svc.getAllDisputes()); }
    @GetMapping("/disputes/open") public R openDisputes() { return ok(svc.getOpenDisputes()); }
    @PostMapping("/disputes/{id}/resolve")
    public R resolveDispute(@PathVariable Long id, @RequestBody Map<String,String> b) {
        return ok(svc.resolveDispute(id, Long.parseLong(b.get("adminId")), b.get("resolution"), b.getOrDefault("note","")));
    }

    // REVIEWS & TRANSACTIONS
    @PostMapping("/projects/{id}/review")
    public R review(@PathVariable Long id, @RequestBody Map<String,String> b) {
        svc.leaveReview(id, Long.parseLong(b.get("clientId")), Integer.parseInt(b.get("rating")), b.get("comment"));
        return ok("Review submitted.");
    }
    @GetMapping("/reviews") public R allReviews() { return ok(svc.getAllReviews()); }
    @GetMapping("/freelancers/{id}/reviews") public R fReviews(@PathVariable Long id) { return ok(svc.getFreelancerReviews(id)); }
    @GetMapping("/freelancers/{id}/rating") public R fRating(@PathVariable Long id) { return ok(Map.of("avg", svc.avgRating(id))); }
    @GetMapping("/transactions") public R allTx() { return ok(svc.getAllTransactions()); }
    @GetMapping("/users/{id}/transactions") public R userTx(@PathVariable Long id) { return ok(svc.getUserTransactions(id)); }
}
// This file needs a new export controller - handled below
