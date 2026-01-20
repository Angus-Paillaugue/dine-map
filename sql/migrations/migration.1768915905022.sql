-- Migration created at 2026-01-20T13:31:45.022Z

CREATE TABLE "user" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "restaurant" ADD COLUMN created_by UUID REFERENCES "user"(id) ON DELETE SET NULL;
ALTER TABLE "review" ADD COLUMN created_by UUID REFERENCES "user"(id) ON DELETE CASCADE;
ALTER TABLE "list" ADD COLUMN created_by UUID REFERENCES "user"(id) ON DELETE CASCADE;

CREATE INDEX idx_restaurant_created_by ON restaurant(created_by);
CREATE INDEX idx_review_created_by ON review(created_by);
CREATE INDEX idx_list_created_by ON list(created_by);


