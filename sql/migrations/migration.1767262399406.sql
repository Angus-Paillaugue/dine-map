-- Migration created at 2026-01-01T10:13:19.406Z

CREATE TABLE restaurant (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  name TEXT NOT NULL,
  coordinates POINT NOT NULL
);

CREATE TABLE review (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  restaurant_id UUID REFERENCES restaurant(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
