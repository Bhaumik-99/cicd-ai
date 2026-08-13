const API_BASE = '/api';

export interface Pipeline {
  id: string;
  repository: string;
  branch: string;
  commitSha: string;
  author: string;
  status: string;
  buildLog: string | null;
  testResults: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStats {
  total: number;
  successful: number;
  failed: number;
  running: number;
  queued: number;
  analyzing: number;
  resolved: number;
  failureRate: number;
  averageBuildTimeMs: number;
}

export interface FailureAnalysis {
  id: string;
  pipelineId: string;
  failureType: string;
  rootCause: string;
  confidence: number;
  affectedFiles: string;
  explanation: string;
  suggestedFix: string;
  severity: string;
  buildLog: string;
  commitSha: string;
  repository: string;
  branch: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  pipelineId: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  read: boolean;
  createdAt: string;
}

// In-memory fallback store for standalone Vercel preview (if backend is not deployed)
const mockPipelines: Pipeline[] = [
  {
    id: "demo-pipe-1",
    repository: "demo-repo",
    branch: "main",
    commitSha: "20e32e1",
    author: "developer",
    status: "RESOLVED",
    buildLog: `[2026-08-13T19:05:29.508Z] Starting build...\n[INFO] Scanning for projects...\n[INFO] --- maven-compiler-plugin:3.11.0:compile ---\n[INFO] Compiling 5 source files to /target/classes\n[INFO] --- maven-surefire-plugin:3.1.2:test ---\n[INFO] Running com.demo.payment.PaymentServiceTest\n[ERROR] Tests run: 4, Failures: 1, Errors: 1, Skipped: 0\n\n-------------------------------------------------------\n T E S T S\n-------------------------------------------------------\n[ERROR] PaymentServiceTest.testProcessPayment:42\n  java.lang.NullPointerException: Cannot invoke "com.demo.payment.PaymentGateway.charge(double)" because "this.paymentGateway" is null\n    at com.demo.payment.PaymentService.processPayment(PaymentService.java:28)\n    at com.demo.payment.PaymentServiceTest.testProcessPayment(PaymentServiceTest.java:42)\n\n[INFO] Results:\n[INFO] Tests run: 4, Failures: 1, Errors: 1, Skipped: 0\n[INFO] BUILD FAILURE\n[INFO] Total time: 3.2s`,
    testResults: "Tests run: 4, Failures: 1, Errors: 1, Skipped: 0",
    errorMessage: "java.lang.NullPointerException: Cannot invoke \"com.demo.payment.PaymentGateway.charge(double)\" because \"this.paymentGateway\" is null",
    startedAt: new Date(Date.now() - 300000).toISOString(),
    completedAt: new Date(Date.now() - 296000).toISOString(),
    durationMs: 3261,
    createdAt: new Date(Date.now() - 300000).toISOString(),
    updatedAt: new Date(Date.now() - 295000).toISOString()
  }
];

const mockFailures: FailureAnalysis[] = [
  {
    id: "analysis-1",
    pipelineId: "demo-pipe-1",
    failureType: "TEST_FAILURE",
    rootCause: "NullPointerException in PaymentService.processPayment() - The paymentGateway field is null because dependency injection was not properly configured. A recent code change removed the constructor injection, causing the field to remain uninitialized.",
    confidence: 0.92,
    affectedFiles: JSON.stringify(["src/main/java/com/demo/payment/PaymentService.java", "src/main/java/com/demo/payment/PaymentGateway.java"]),
    explanation: "The build log shows a NullPointerException at PaymentService.java:28 where this.paymentGateway.charge(double) is called. The paymentGateway field is null, indicating it was never injected.\n\nTwo test methods fail: testProcessPayment and testRefundPayment, both attempting to use the null paymentGateway reference.",
    suggestedFix: "Use constructor injection in PaymentService:\n\n```java\n@Service\npublic class PaymentService {\n    private final PaymentGateway paymentGateway;\n\n    @Autowired\n    public PaymentService(PaymentGateway paymentGateway) {\n        this.paymentGateway = paymentGateway;\n    }\n}\n```\n\nAlso ensure PaymentGateway is annotated with @Component or @Service.",
    severity: "HIGH",
    buildLog: mockPipelines[0].buildLog || "",
    commitSha: "20e32e1",
    repository: "demo-repo",
    branch: "main",
    createdAt: new Date(Date.now() - 295000).toISOString()
  }
];

const mockNotifications: Notification[] = [
  {
    id: "notif-1",
    pipelineId: "demo-pipe-1",
    type: "AI_ANALYSIS",
    title: "🔴 Build Failed: demo-repo — TEST_FAILURE (92% confidence)",
    message: "Root Cause: NullPointerException in PaymentService.processPayment()...\n\nSeverity: HIGH\n\nSuggested Fix: Add constructor injection back to PaymentService.",
    severity: "HIGH",
    read: false,
    createdAt: new Date(Date.now() - 294000).toISOString()
  }
];

export const api = {
  // Pipelines
  getPipelines: async (): Promise<Pipeline[]> => {
    try {
      const res = await fetch(`${API_BASE}/pipelines`);
      if (res.ok) return await res.json();
    } catch { /* fallback */ }
    return [...mockPipelines];
  },

  getPipeline: async (id: string): Promise<Pipeline> => {
    try {
      const res = await fetch(`${API_BASE}/pipelines/${id}`);
      if (res.ok) return await res.json();
    } catch { /* fallback */ }
    return mockPipelines.find(p => p.id === id) || mockPipelines[0];
  },

  getPipelineStats: async (): Promise<PipelineStats> => {
    try {
      const res = await fetch(`${API_BASE}/pipelines/stats`);
      if (res.ok) return await res.json();
    } catch { /* fallback */ }
    const total = mockPipelines.length;
    const failed = mockPipelines.filter(p => p.status === 'FAILED' || p.status === 'RESOLVED').length;
    const successful = mockPipelines.filter(p => p.status === 'SUCCESS').length;
    return {
      total,
      successful,
      failed,
      running: mockPipelines.filter(p => p.status === 'RUNNING').length,
      queued: mockPipelines.filter(p => p.status === 'QUEUED').length,
      analyzing: mockPipelines.filter(p => p.status === 'ANALYZING').length,
      resolved: mockPipelines.filter(p => p.status === 'RESOLVED').length,
      failureRate: total > 0 ? Math.round((failed / total) * 100) : 0,
      averageBuildTimeMs: 3200
    };
  },

  // Failures
  getFailures: async (params?: Record<string, string>): Promise<FailureAnalysis[]> => {
    try {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      const res = await fetch(`${API_BASE}/failures${query}`);
      if (res.ok) return await res.json();
    } catch { /* fallback */ }
    return [...mockFailures];
  },

  getFailure: async (id: string): Promise<FailureAnalysis> => {
    try {
      const res = await fetch(`${API_BASE}/failures/${id}`);
      if (res.ok) return await res.json();
    } catch { /* fallback */ }
    return mockFailures.find(f => f.id === id) || mockFailures[0];
  },

  getFailureByPipeline: async (pipelineId: string): Promise<FailureAnalysis> => {
    try {
      const res = await fetch(`${API_BASE}/failures/pipeline/${pipelineId}`);
      if (res.ok) return await res.json();
    } catch { /* fallback */ }
    return mockFailures.find(f => f.pipelineId === pipelineId) || mockFailures[0];
  },

  // Notifications
  getNotifications: async (): Promise<Notification[]> => {
    try {
      const res = await fetch(`${API_BASE}/notifications`);
      if (res.ok) return await res.json();
    } catch { /* fallback */ }
    return [...mockNotifications];
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    try {
      const res = await fetch(`${API_BASE}/notifications/count`);
      if (res.ok) return await res.json();
    } catch { /* fallback */ }
    return { count: mockNotifications.filter(n => !n.read).length };
  },

  markRead: async (id: string): Promise<void> => {
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PUT' });
    } catch { /* fallback */ }
    const n = mockNotifications.find(x => x.id === id);
    if (n) n.read = true;
  },

  markAllRead: async (): Promise<void> => {
    try {
      await fetch(`${API_BASE}/notifications/read-all`, { method: 'PUT' });
    } catch { /* fallback */ }
    mockNotifications.forEach(n => n.read = true);
  },

  // Webhook simulation
  simulatePush: async (injectBug: boolean = true): Promise<any> => {
    try {
      const res = await fetch(`${API_BASE}/webhooks/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repository: 'demo-repo',
          branch: 'main',
          author: 'developer',
          commitMessage: injectBug ? 'Remove @Autowired from PaymentService' : 'Fix PaymentService injection',
          injectBug
        })
      });
      if (res.ok) return await res.json();
    } catch { /* fallback in-memory simulation */ }

    const newId = 'pipe-' + Math.random().toString(36).substring(2, 8);
    const newPipe: Pipeline = {
      id: newId,
      repository: 'demo-repo',
      branch: 'main',
      commitSha: Math.random().toString(16).substring(2, 9),
      author: 'developer',
      status: injectBug ? 'RESOLVED' : 'SUCCESS',
      buildLog: mockPipelines[0].buildLog,
      testResults: injectBug ? "Tests run: 4, Failures: 1, Errors: 1, Skipped: 0" : "Tests run: 7, Failures: 0, Errors: 0, Skipped: 0",
      errorMessage: injectBug ? mockPipelines[0].errorMessage : null,
      startedAt: new Date().toISOString(),
      completedAt: new Date(Date.now() + 3000).toISOString(),
      durationMs: 3100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockPipelines.unshift(newPipe);

    if (injectBug) {
      mockFailures.unshift({
        ...mockFailures[0],
        id: 'analysis-' + newId,
        pipelineId: newId,
        commitSha: newPipe.commitSha,
        createdAt: new Date().toISOString()
      });
      mockNotifications.unshift({
        id: 'notif-' + newId,
        pipelineId: newId,
        type: 'AI_ANALYSIS',
        title: `🔴 Build Failed: demo-repo — TEST_FAILURE (92% confidence)`,
        message: `Root Cause: NullPointerException in PaymentService.processPayment()...\n\nSeverity: HIGH\n\nSuggested Fix: Add constructor injection back to PaymentService.`,
        severity: 'HIGH',
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    return { status: "accepted", eventId: newId, commitSha: newPipe.commitSha, repository: "demo-repo" };
  }
};
