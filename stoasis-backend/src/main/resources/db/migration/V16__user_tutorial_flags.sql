CREATE TABLE user_flags (
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flag_key VARCHAR(96) NOT NULL,
    outcome VARCHAR(16) NOT NULL CHECK (outcome IN ('completed', 'skipped')),
    seen_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (user_id, flag_key)
);
