-- Add require_married option and custom_order to cau_duong_pools
ALTER TABLE cau_duong_pools ADD COLUMN require_married INTEGER NOT NULL DEFAULT 1;
ALTER TABLE cau_duong_pools ADD COLUMN custom_order TEXT DEFAULT NULL;
