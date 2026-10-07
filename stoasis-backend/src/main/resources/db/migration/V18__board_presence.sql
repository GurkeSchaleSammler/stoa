CREATE TABLE board_presence (
    id VARCHAR(64) PRIMARY KEY,
    member_id BIGINT NOT NULL REFERENCES collection_members(id) ON DELETE CASCADE,
    client_id VARCHAR(36) NOT NULL,
    x DOUBLE PRECISION,
    y DOUBLE PRECISION,
    seen_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uk_board_presence_client UNIQUE (member_id, client_id),
    CONSTRAINT ck_board_presence_position CHECK (
        (x IS NULL AND y IS NULL) OR
        (x IS NOT NULL AND y IS NOT NULL AND x >= 0 AND x <= 2240 AND y >= 0 AND y <= 3360)
    )
);
CREATE INDEX idx_board_presence_seen ON board_presence(seen_at);
