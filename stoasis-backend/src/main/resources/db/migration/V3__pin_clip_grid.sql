ALTER TABLE pins ADD COLUMN grid_x INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pins ADD COLUMN grid_y INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pins ADD COLUMN height_clips INTEGER NOT NULL DEFAULT 16;
ALTER TABLE pins ADD COLUMN layer INTEGER NOT NULL DEFAULT 0;

UPDATE pins
SET grid_x = MOD(sort_order - 1, 5) * 18,
    grid_y = FLOOR((sort_order - 1) / 5) * 22,
    height_clips = CASE type
        WHEN 'link' THEN 18
        WHEN 'photo' THEN 16
        ELSE 14
    END,
    layer = sort_order;

ALTER TABLE pins ADD CONSTRAINT chk_pins_grid_x CHECK (grid_x BETWEEN 0 AND 144);
ALTER TABLE pins ADD CONSTRAINT chk_pins_grid_y CHECK (grid_y BETWEEN 0 AND 239);
ALTER TABLE pins ADD CONSTRAINT chk_pins_height_clips CHECK (height_clips BETWEEN 1 AND 240);
ALTER TABLE pins ADD CONSTRAINT chk_pins_layer CHECK (layer >= 0);

CREATE INDEX idx_pins_collection_layer ON pins(collection_id, layer);
