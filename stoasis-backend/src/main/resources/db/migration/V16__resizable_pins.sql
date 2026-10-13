ALTER TABLE pins ADD COLUMN width_clips INTEGER NOT NULL DEFAULT 16;
ALTER TABLE pins ADD COLUMN base_height_clips INTEGER NOT NULL DEFAULT 16;
ALTER TABLE pins ADD COLUMN manual_size BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE pins SET base_height_clips = height_clips;

ALTER TABLE pins ADD CONSTRAINT chk_pins_width_clips CHECK (width_clips BETWEEN 16 AND 32);
ALTER TABLE pins ADD CONSTRAINT chk_pins_base_height_clips CHECK (base_height_clips BETWEEN 1 AND 240);
