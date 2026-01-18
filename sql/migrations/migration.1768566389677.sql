-- Migration created at 2026-01-16T12:26:29.677Z

CREATE TYPE dietary_preference_type AS ENUM ('vegan', 'vegetarian', 'halal');

CREATE TABLE dietary_preference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  restaurant_id UUID REFERENCES restaurant(id) ON DELETE CASCADE,
  type dietary_preference_type NOT NULL,
  is_available BOOLEAN NOT NULL,
  UNIQUE (restaurant_id, type)
);
