package com.cicdai.pipeline.dto;

import java.time.Instant;
import java.util.UUID;

public class CicdEvent {

    private String eventId;
    private String eventType;
    private String eventVersion;
    private String timestamp;
    private String source;
    private String pipelineId;
    private String correlationId;
    private Object payload;

    public CicdEvent() {}

    public static CicdEvent create(String eventType, String source, Object payload) {
        CicdEvent event = new CicdEvent();
        event.eventId = UUID.randomUUID().toString();
        event.eventType = eventType;
        event.eventVersion = "1.0";
        event.timestamp = Instant.now().toString();
        event.source = source;
        event.correlationId = UUID.randomUUID().toString();
        event.payload = payload;
        return event;
    }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getEventVersion() { return eventVersion; }
    public void setEventVersion(String eventVersion) { this.eventVersion = eventVersion; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getPipelineId() { return pipelineId; }
    public void setPipelineId(String pipelineId) { this.pipelineId = pipelineId; }
    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }
    public Object getPayload() { return payload; }
    public void setPayload(Object payload) { this.payload = payload; }
}
