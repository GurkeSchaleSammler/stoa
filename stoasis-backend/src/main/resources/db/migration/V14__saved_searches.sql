CREATE TABLE saved_searches (
    id VARCHAR(64) PRIMARY KEY,
    owner_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    query_json TEXT NOT NULL
);
CREATE INDEX idx_saved_search_owner ON saved_searches(owner_id);
