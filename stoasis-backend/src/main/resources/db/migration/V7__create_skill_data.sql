CREATE TABLE skill_data (
    pin_id VARCHAR(64) PRIMARY KEY REFERENCES pins(id) ON DELETE CASCADE,
    skill_name VARCHAR(120) NOT NULL,
    level VARCHAR(20) NOT NULL,
    years_experience SMALLINT,
    CONSTRAINT chk_skill_data_level
        CHECK (level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT')),
    CONSTRAINT chk_skill_data_years
        CHECK (years_experience IS NULL OR years_experience BETWEEN 0 AND 80)
);

CREATE INDEX idx_skill_data_name ON skill_data(skill_name);

