ALTER TABLE pins ADD CONSTRAINT chk_pins_type
    CHECK (type IN ('link', 'note', 'photo', 'skill'));

