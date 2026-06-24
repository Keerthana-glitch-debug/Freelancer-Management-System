package com.freelancer.controller;

import com.freelancer.entity.*;
import com.freelancer.service.FreelancerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/export")
public class ExportController {

    @Autowired FreelancerService svc;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private String safe(String s) { return s == null ? "" : s.replace(",", ";").replace("\n", " ").replace("\r", " "); }
    private String fmt(LocalDateTime d) { return d == null ? "" : d.format(FMT); }

    // ── CSV EXPORTS ───────────────────────────────────────────

    @GetMapping("/projects.csv")
    public ResponseEntity<byte[]> exportProjectsCsv() {
        List<Project> projects = svc.getAllProjects();
        Map<Long, User> userMap = new HashMap<>();
        svc.getAllUsers().forEach(u -> userMap.put(u.getId(), u));

        StringBuilder sb = new StringBuilder();
        sb.append("Project ID,Title,Description,Budget,Status,Client ID,Client Name,Freelancer ID,Freelancer Name,Created At\n");
        for (Project p : projects) {
            User client = userMap.get(p.getClientId());
            User fl = p.getAssignedId() != null ? userMap.get(p.getAssignedId()) : null;
            sb.append(String.format("%d,%s,%s,%.2f,%s,%d,%s,%s,%s,%s\n",
                p.getId(), safe(p.getTitle()), safe(p.getDescription()), p.getBudget(),
                p.getStatus(), p.getClientId(), safe(client != null ? client.getName() : ""),
                p.getAssignedId() != null ? p.getAssignedId() : "",
                safe(fl != null ? fl.getName() : ""), fmt(p.getCreatedAt())));
        }
        return csvResponse(sb.toString(), "projects.csv");
    }

    @GetMapping("/users.csv")
    public ResponseEntity<byte[]> exportUsersCsv() {
        List<User> users = svc.getAllUsers();
        StringBuilder sb = new StringBuilder();
        sb.append("User ID,Name,Email,Role,Wallet Balance,Active,Skills,Bio\n");
        for (User u : users) {
            sb.append(String.format("%d,%s,%s,%s,%.2f,%s,%s,%s\n",
                u.getId(), safe(u.getName()), safe(u.getEmail()), u.getRole(),
                u.getWallet(), u.isActive() ? "Yes" : "No",
                safe(u.getSkills()), safe(u.getBio())));
        }
        return csvResponse(sb.toString(), "users.csv");
    }

    @GetMapping("/transactions.csv")
    public ResponseEntity<byte[]> exportTransactionsCsv() {
        List<Transaction> txs = svc.getAllTransactions();
        Map<Long, User> userMap = new HashMap<>();
        svc.getAllUsers().forEach(u -> userMap.put(u.getId(), u));
        StringBuilder sb = new StringBuilder();
        sb.append("Transaction ID,From User ID,From Name,To User ID,To Name,Amount,Note,Date\n");
        for (Transaction t : txs) {
            User from = userMap.get(t.getFromId());
            User to = userMap.get(t.getToId());
            sb.append(String.format("%d,%d,%s,%d,%s,%.2f,%s,%s\n",
                t.getId(), t.getFromId(), safe(from != null ? from.getName() : ""),
                t.getToId(), safe(to != null ? to.getName() : ""),
                t.getAmount(), safe(t.getNote()), fmt(t.getCreatedAt())));
        }
        return csvResponse(sb.toString(), "transactions.csv");
    }

    @GetMapping("/reviews.csv")
    public ResponseEntity<byte[]> exportReviewsCsv() {
        List<Review> reviews = svc.getAllReviews();
        Map<Long, User> userMap = new HashMap<>();
        svc.getAllUsers().forEach(u -> userMap.put(u.getId(), u));
        StringBuilder sb = new StringBuilder();
        sb.append("Review ID,Project ID,Freelancer ID,Freelancer Name,Client ID,Client Name,Rating,Comment,Date\n");
        for (Review r : reviews) {
            User fl = userMap.get(r.getFreelancerId());
            User cl = userMap.get(r.getClientId());
            sb.append(String.format("%d,%d,%d,%s,%d,%s,%d,%s,%s\n",
                r.getId(), r.getProjectId(),
                r.getFreelancerId(), safe(fl != null ? fl.getName() : ""),
                r.getClientId(), safe(cl != null ? cl.getName() : ""),
                r.getRating(), safe(r.getComment()), fmt(r.getCreatedAt())));
        }
        return csvResponse(sb.toString(), "reviews.csv");
    }

    @GetMapping("/submissions.csv")
    public ResponseEntity<byte[]> exportSubmissionsCsv() {
        List<Submission> subs = svc.getAllProjects().stream()
            .flatMap(p -> svc.getProjectSubmissions(p.getId()).stream())
            .collect(Collectors.toList());
        Map<Long, User> userMap = new HashMap<>();
        svc.getAllUsers().forEach(u -> userMap.put(u.getId(), u));
        StringBuilder sb = new StringBuilder();
        sb.append("Submission ID,Project ID,Milestone ID,Freelancer ID,Freelancer Name,Revision Round,Status,Description,External Link,Client Note,Submitted At,Reviewed At\n");
        for (Submission s : subs) {
            User fl = userMap.get(s.getFreelancerId());
            sb.append(String.format("%d,%d,%d,%d,%s,%d,%s,%s,%s,%s,%s,%s\n",
                s.getId(), s.getProjectId(), s.getMilestoneId(),
                s.getFreelancerId(), safe(fl != null ? fl.getName() : ""),
                s.getRevisionRound(), s.getStatus(),
                safe(s.getDescription()), safe(s.getExternalLink()),
                safe(s.getClientNote()), fmt(s.getSubmittedAt()), fmt(s.getReviewedAt())));
        }
        return csvResponse(sb.toString(), "submissions.csv");
    }

    // ── FULL REPORT (HTML → downloadable) ────────────────────

    @GetMapping(value = "/full-report.html", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<byte[]> exportFullReport() {
        List<Project> projects = svc.getAllProjects();
        List<User> users = svc.getAllUsers();
        List<Transaction> txs = svc.getAllTransactions();
        List<Review> reviews = svc.getAllReviews();
        Map<Long, User> userMap = new HashMap<>();
        users.forEach(u -> userMap.put(u.getId(), u));

        double totalPaid = txs.stream().mapToDouble(Transaction::getAmount).sum();
        long clientCount = users.stream().filter(u -> "CLIENT".equals(u.getRole())).count();
        long flCount = users.stream().filter(u -> "FREELANCER".equals(u.getRole())).count();
        long paidProjects = projects.stream().filter(p -> "PAID".equals(p.getStatus())).count();

        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><head><meta charset='UTF-8'/><title>FreelanceHub Full Report</title><style>");
        sb.append("body{font-family:Segoe UI,sans-serif;color:#333;padding:40px;background:#fff5f7}");
        sb.append("h1{color:#d81b60;border-bottom:3px solid #f48fb1;padding-bottom:12px}");
        sb.append("h2{color:#d81b60;margin-top:40px;margin-bottom:14px;font-size:18px}");
        sb.append(".stat-row{display:flex;gap:20px;flex-wrap:wrap;margin-bottom:30px}");
        sb.append(".stat{background:white;border:2px solid #f8bbd0;border-radius:12px;padding:18px 24px;text-align:center;min-width:130px}");
        sb.append(".stat .n{font-size:28px;font-weight:800;color:#d81b60}.stat .l{font-size:12px;color:#888;margin-top:4px}");
        sb.append("table{width:100%;border-collapse:collapse;margin-bottom:30px;background:white;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(216,27,96,.07)}");
        sb.append("th{background:#fce4ec;color:#d81b60;padding:11px 14px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.4px}");
        sb.append("td{padding:10px 14px;border-bottom:1px solid #fff5f7;font-size:13px}");
        sb.append("tr:last-child td{border-bottom:none}tr:nth-child(even) td{background:#fffafc}");
        sb.append(".badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700}");
        sb.append(".footer{text-align:center;color:#aaa;font-size:12px;margin-top:50px;padding-top:20px;border-top:1px solid #f8bbd0}");
        sb.append("@media print{body{background:white}.stat{border:1px solid #ccc}}");
        sb.append("</style></head><body>");

        sb.append("<h1>💼 FreelanceHub — Full Platform Report</h1>");
        sb.append("<p style='color:#888;margin-bottom:24px'>Generated: ").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm"))).append("</p>");

        // Summary
        sb.append("<div class='stat-row'>");
        sb.append(stat(users.size(), "Total Users"));
        sb.append(stat((int)clientCount, "Clients"));
        sb.append(stat((int)flCount, "Freelancers"));
        sb.append(stat(projects.size(), "Total Projects"));
        sb.append(stat((int)paidProjects, "Completed"));
        sb.append(stat(txs.size(), "Transactions"));
        sb.append(stat("$"+String.format("%.2f",totalPaid), "Total Paid Out"));
        sb.append(stat(reviews.size(), "Reviews"));
        sb.append("</div>");

        // Projects table
        sb.append("<h2>📋 All Projects</h2><table>");
        sb.append("<thead><tr><th>ID</th><th>Title</th><th>Budget</th><th>Status</th><th>Client</th><th>Freelancer</th><th>Description</th><th>Created</th></tr></thead><tbody>");
        for (Project p : projects) {
            User cl = userMap.get(p.getClientId());
            User fl = p.getAssignedId() != null ? userMap.get(p.getAssignedId()) : null;
            sb.append("<tr><td>#").append(p.getId()).append("</td>")
              .append("<td><strong>").append(esc(p.getTitle())).append("</strong></td>")
              .append("<td><strong>$").append(String.format("%.2f",p.getBudget())).append("</strong></td>")
              .append("<td>").append(p.getStatus()).append("</td>")
              .append("<td>").append(cl!=null?esc(cl.getName()):"#"+p.getClientId()).append("</td>")
              .append("<td>").append(fl!=null?esc(fl.getName()):"—").append("</td>")
              .append("<td style='max-width:200px;overflow:hidden'>").append(esc(p.getDescription()!=null?p.getDescription().substring(0,Math.min(80,p.getDescription().length())):"")).append("</td>")
              .append("<td>").append(fmt(p.getCreatedAt())).append("</td></tr>");
        }
        sb.append("</tbody></table>");

        // Per-project deep detail
        sb.append("<h2>🔍 Per-Project Detail</h2>");
        for (Project p : projects) {
            User cl = userMap.get(p.getClientId());
            User fl = p.getAssignedId() != null ? userMap.get(p.getAssignedId()) : null;
            List<Submission> psubs = svc.getProjectSubmissions(p.getId());
            List<Milestone> ms = svc.getMilestones(p.getId());
            Optional<Contract> contract = svc.getContractByProject(p.getId());

            sb.append("<div style='background:white;border:2px solid #f8bbd0;border-radius:12px;padding:20px;margin-bottom:20px'>");
            sb.append("<div style='display:flex;justify-content:space-between;align-items:flex-start'>");
            sb.append("<h3 style='color:#d81b60;margin:0'>").append(esc(p.getTitle())).append("</h3>");
            sb.append("<span class='badge' style='background:#fce4ec;color:#d81b60'>").append(p.getStatus()).append("</span></div>");
            sb.append("<p style='color:#888;font-size:12px;margin:6px 0'>Budget: $").append(String.format("%.2f",p.getBudget()))
              .append(" | Client: ").append(cl!=null?esc(cl.getName()):"#"+p.getClientId())
              .append(" | Freelancer: ").append(fl!=null?esc(fl.getName()):"Not assigned")
              .append(" | Posted: ").append(fmt(p.getCreatedAt())).append("</p>");
            if (p.getDescription() != null)
                sb.append("<p style='font-size:13px;margin:8px 0'>").append(esc(p.getDescription())).append("</p>");

            if (contract.isPresent()) {
                Contract c = contract.get();
                sb.append("<div style='background:#fff5f7;border:1px solid #f8bbd0;border-radius:8px;padding:12px;margin:10px 0;font-size:12px'>");
                sb.append("<strong>📄 Contract:</strong> ").append(c.getStatus())
                  .append(" | Revisions: ").append(c.getRevisionLimit())
                  .append("<br><em>").append(esc(c.getTerms())).append("</em></div>");
            }

            if (!ms.isEmpty()) {
                sb.append("<table style='margin-top:10px'><thead><tr><th>Milestone</th><th>Amount</th><th>Status</th></tr></thead><tbody>");
                for (Milestone m : ms)
                    sb.append("<tr><td>").append(esc(m.getTitle())).append("</td><td>$").append(String.format("%.2f",m.getAmount())).append("</td><td>").append(m.getStatus()).append("</td></tr>");
                sb.append("</tbody></table>");
            }

            if (!psubs.isEmpty()) {
                sb.append("<table style='margin-top:10px'><thead><tr><th>Submission</th><th>Round</th><th>Status</th><th>Description</th><th>Link</th><th>Client Note</th><th>Date</th></tr></thead><tbody>");
                for (Submission s : psubs)
                    sb.append("<tr><td>#").append(s.getId()).append("</td><td>").append(s.getRevisionRound()+1)
                      .append("</td><td>").append(s.getStatus())
                      .append("</td><td>").append(esc(s.getDescription()!=null?s.getDescription():""))
                      .append("</td><td>").append(s.getExternalLink()!=null?"<a href='"+s.getExternalLink()+"'>link</a>":"—")
                      .append("</td><td>").append(esc(s.getClientNote()!=null?s.getClientNote():"—"))
                      .append("</td><td>").append(fmt(s.getSubmittedAt())).append("</td></tr>");
                sb.append("</tbody></table>");
            }
            sb.append("</div>");
        }

        // Users table
        sb.append("<h2>👥 All Users</h2><table>");
        sb.append("<thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Wallet</th><th>Status</th><th>Skills</th></tr></thead><tbody>");
        for (User u : users)
            sb.append("<tr><td>#").append(u.getId()).append("</td><td>").append(esc(u.getName()))
              .append("</td><td>").append(esc(u.getEmail())).append("</td><td>").append(u.getRole())
              .append("</td><td>$").append(String.format("%.2f",u.getWallet()))
              .append("</td><td>").append(u.isActive()?"✅ Active":"❌ Inactive")
              .append("</td><td>").append(esc(u.getSkills()!=null?u.getSkills():"")).append("</td></tr>");
        sb.append("</tbody></table>");

        // Transactions
        sb.append("<h2>💳 All Transactions</h2><table>");
        sb.append("<thead><tr><th>ID</th><th>From</th><th>To</th><th>Amount</th><th>Note</th><th>Date</th></tr></thead><tbody>");
        for (Transaction t : txs) {
            User from = userMap.get(t.getFromId());
            User to = userMap.get(t.getToId());
            sb.append("<tr><td>#").append(t.getId())
              .append("</td><td>").append(from!=null?esc(from.getName()):"#"+t.getFromId())
              .append("</td><td>").append(to!=null?esc(to.getName()):"#"+t.getToId())
              .append("</td><td><strong>$").append(String.format("%.2f",t.getAmount()))
              .append("</strong></td><td>").append(esc(t.getNote()!=null?t.getNote():""))
              .append("</td><td>").append(fmt(t.getCreatedAt())).append("</td></tr>");
        }
        sb.append("</tbody></table>");

        // Reviews
        sb.append("<h2>⭐ All Reviews</h2><table>");
        sb.append("<thead><tr><th>ID</th><th>Project</th><th>Freelancer</th><th>Client</th><th>Rating</th><th>Comment</th><th>Date</th></tr></thead><tbody>");
        for (Review r : reviews) {
            User fl = userMap.get(r.getFreelancerId());
            User cl = userMap.get(r.getClientId());
            sb.append("<tr><td>#").append(r.getId())
              .append("</td><td>#").append(r.getProjectId())
              .append("</td><td>").append(fl!=null?esc(fl.getName()):"#"+r.getFreelancerId())
              .append("</td><td>").append(cl!=null?esc(cl.getName()):"#"+r.getClientId())
              .append("</td><td>").append("★".repeat(r.getRating())).append("☆".repeat(5-r.getRating()))
              .append(" (").append(r.getRating()).append("/5)")
              .append("</td><td>").append(esc(r.getComment()!=null?r.getComment():""))
              .append("</td><td>").append(fmt(r.getCreatedAt())).append("</td></tr>");
        }
        sb.append("</tbody></table>");

        sb.append("<div class='footer'>FreelanceHub Platform Report · Generated ").append(LocalDateTime.now().format(FMT)).append("</div>");
        sb.append("</body></html>");

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=freelancehub-full-report.html")
            .contentType(MediaType.TEXT_HTML)
            .body(sb.toString().getBytes());
    }

    private String stat(Object val, String label) {
        return "<div class='stat'><div class='n'>"+val+"</div><div class='l'>"+label+"</div></div>";
    }
    private String esc(String s) {
        if (s == null) return "";
        return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;");
    }
    private ResponseEntity<byte[]> csvResponse(String csv, String filename) {
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(csv.getBytes());
    }
}
