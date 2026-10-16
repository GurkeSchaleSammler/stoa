ALTER TABLE board_connectors ADD COLUMN label VARCHAR(120) NOT NULL DEFAULT '';
CREATE TABLE board_pin_dates (
    pin_id VARCHAR(64) PRIMARY KEY REFERENCES pins(id) ON DELETE CASCADE,
    collection_id VARCHAR(64) NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    CONSTRAINT chk_board_pin_dates CHECK (end_date IS NULL OR end_date >= start_date)
);
CREATE INDEX idx_board_pin_dates_collection ON board_pin_dates(collection_id);
CREATE TABLE board_presentation_paths (
    id VARCHAR(64) PRIMARY KEY,
    collection_id VARCHAR(64) NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL
);
CREATE INDEX idx_board_paths_collection ON board_presentation_paths(collection_id);
CREATE TABLE board_presentation_steps (
    path_id VARCHAR(64) NOT NULL REFERENCES board_presentation_paths(id) ON DELETE CASCADE,
    pin_id VARCHAR(64) NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL CHECK (step_order >= 0),
    PRIMARY KEY (path_id, step_order)
);
CREATE INDEX idx_board_steps_pin ON board_presentation_steps(pin_id);
