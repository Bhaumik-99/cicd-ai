package com.cicdai.webhook.dto;

public class SimulateRequest {

    private String repository;
    private String branch;
    private String commitSha;
    private String author;
    private String commitMessage;
    private boolean injectBug;

    public SimulateRequest() {
    }

    public String getRepository() { return repository; }
    public void setRepository(String repository) { this.repository = repository; }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }

    public String getCommitSha() { return commitSha; }
    public void setCommitSha(String commitSha) { this.commitSha = commitSha; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getCommitMessage() { return commitMessage; }
    public void setCommitMessage(String commitMessage) { this.commitMessage = commitMessage; }

    public boolean isInjectBug() { return injectBug; }
    public void setInjectBug(boolean injectBug) { this.injectBug = injectBug; }
}
