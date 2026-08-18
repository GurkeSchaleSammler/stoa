CREATE TABLE group_entities (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    owner_id VARCHAR(64) NOT NULL REFERENCES users(id),
    invite_token VARCHAR(96) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE group_members (
    group_id VARCHAR(64) NOT NULL REFERENCES group_entities(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sharing_preference VARCHAR(20) NOT NULL DEFAULT 'NONE',
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (group_id, user_id),
    CONSTRAINT chk_group_members_sharing
        CHECK (sharing_preference IN ('NONE', 'WORK_ONLY', 'PERSONAL_ONLY', 'BOTH'))
);

CREATE INDEX idx_group_entities_owner ON group_entities(owner_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);

