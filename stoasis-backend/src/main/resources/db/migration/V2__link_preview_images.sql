CREATE TABLE link_preview_images (
    id VARCHAR(64) PRIMARY KEY,
    source_url VARCHAR(4096) NOT NULL,
    content_type VARCHAR(64) NOT NULL,
    content BLOB NOT NULL,
    image_width INTEGER NOT NULL,
    image_height INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
