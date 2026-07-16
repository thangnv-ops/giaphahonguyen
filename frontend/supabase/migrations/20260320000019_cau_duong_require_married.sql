-- Add require_married option and custom_order to cau_duong_pools
ALTER TABLE cau_duong_pools
  ADD COLUMN IF NOT EXISTS require_married BOOLEAN NOT NULL DEFAULT true;

-- Custom rotation order (array of person UUIDs as JSON)
ALTER TABLE cau_duong_pools
  ADD COLUMN IF NOT EXISTS custom_order JSONB DEFAULT NULL;
