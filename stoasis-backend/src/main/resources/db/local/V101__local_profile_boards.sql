INSERT INTO collections (
    id, name, emoji, owner_id, visibility, invite_token,
    created_at, updated_at, board_kind, is_system
)
SELECT 'profile-work-' || u.id, 'Work', '💼', u.id, 'private', NULL,
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'WORK', TRUE
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM collections c
    WHERE c.owner_id = u.id AND c.board_kind = 'WORK'
);

INSERT INTO collections (
    id, name, emoji, owner_id, visibility, invite_token,
    created_at, updated_at, board_kind, is_system
)
SELECT 'profile-personal-' || u.id, 'Personal', '🌿', u.id, 'private', NULL,
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'PERSONAL', TRUE
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM collections c
    WHERE c.owner_id = u.id AND c.board_kind = 'PERSONAL'
);

INSERT INTO collection_allowed_types (collection_id, pin_type)
SELECT c.id, 'skill'
FROM collections c
WHERE c.board_kind IS NOT NULL;

INSERT INTO collection_members (collection_id, user_id, role)
SELECT c.id, c.owner_id, 'owner'
FROM collections c
WHERE c.board_kind IS NOT NULL;

