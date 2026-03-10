
-- Restore profile for admin user, linked to WebsforAfrica
INSERT INTO profiles (user_id, display_name, institution_id)
VALUES ('c3e7ba3d-9db2-4a86-80ba-4bb24719fe25', 'SK', '8118a7a9-a05e-45cd-ac83-81401ba47d47');

-- Restore admin role
INSERT INTO user_roles (user_id, role, institution_id)
VALUES ('c3e7ba3d-9db2-4a86-80ba-4bb24719fe25', 'admin', '8118a7a9-a05e-45cd-ac83-81401ba47d47');
