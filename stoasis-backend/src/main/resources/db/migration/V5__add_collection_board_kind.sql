ALTER TABLE collections ADD COLUMN board_kind VARCHAR(20);
ALTER TABLE collections ADD COLUMN is_system BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE collections ADD CONSTRAINT chk_collections_board_kind
    CHECK (board_kind IS NULL OR board_kind IN ('WORK', 'PERSONAL'));
ALTER TABLE collections ADD CONSTRAINT chk_collections_visibility
    CHECK (visibility IN ('private', 'link', 'public'));

CREATE UNIQUE INDEX uk_collections_owner_board_kind
    ON collections(owner_id, board_kind);
