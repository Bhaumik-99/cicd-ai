package com.cicdai.webhook.dto;

import jakarta.validation.constraints.NotBlank;

public class GitHubPushPayload {

    @NotBlank(message = "Repository is required")
    private String repository;

    @NotBlank(message = "Branch is required")
    private String branch;

    @NotBlank(message = "Commit SHA is required")
    private String commitSha;

    private String author;
    private String commitMessage;

    public GitHubPushPayload() {
    }

    public GitHubPushPayload(String repository, String branch, String commitSha, String author) {
        this.repository = repository;
        this.branch = branch;
        this.commitSha = commitSha;
        this.author = author;
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
}
