CREATE TABLE stoaql_query_history (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    collection_id VARCHAR(64) REFERENCES collections(id) ON DELETE CASCADE,
    query_id VARCHAR(64),
    query_text TEXT NOT NULL,
    language_version VARCHAR(16) NOT NULL,
    dry_run BOOLEAN NOT NULL,
    success BOOLEAN NOT NULL,
    operation_count INTEGER NOT NULL,
    result_count INTEGER NOT NULL,
    duration_ms BIGINT,
    error_code VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_stoaql_history_user_board_created
    ON stoaql_query_history(user_id, collection_id, created_at);
