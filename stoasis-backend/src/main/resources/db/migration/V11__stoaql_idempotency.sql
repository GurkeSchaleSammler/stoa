CREATE TABLE stoaql_query_requests (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    idempotency_key VARCHAR(128) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    response_json TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uk_stoaql_idempotency UNIQUE (user_id, idempotency_key)
);

CREATE INDEX idx_stoaql_query_requests_created_at ON stoaql_query_requests(created_at);
