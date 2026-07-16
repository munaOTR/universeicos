-- Universe Seed Data

-- 1. Insert Universities
INSERT INTO public.universities (name, acronym, domain) VALUES
('University of Lagos', 'UNILAG', 'unilag.edu.ng'),
('University of Ibadan', 'UI', 'ui.edu.ng'),
('Obafemi Awolowo University', 'OAU', 'oauife.edu.ng'),
('Covenant University', 'CU', 'covenantuniversity.edu.ng'),
('Ahmadu Bello University', 'ABU', 'abu.edu.ng')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Faculties for UNILAG
INSERT INTO public.faculties (university_id, name)
SELECT id, 'Faculty of Engineering' FROM public.universities WHERE acronym = 'UNILAG'
ON CONFLICT DO NOTHING;

INSERT INTO public.faculties (university_id, name)
SELECT id, 'Faculty of Science' FROM public.universities WHERE acronym = 'UNILAG'
ON CONFLICT DO NOTHING;

-- 3. Insert Departments for UNILAG Engineering
INSERT INTO public.departments (faculty_id, name)
SELECT id, 'Computer Engineering' FROM public.faculties WHERE name = 'Faculty of Engineering'
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (faculty_id, name)
SELECT id, 'Systems Engineering' FROM public.faculties WHERE name = 'Faculty of Engineering'
ON CONFLICT DO NOTHING;

-- 4. Insert Roles & Permissions
INSERT INTO public.roles (name, description) VALUES
('super_admin', 'Has unrestricted access to all resources'),
('admin', 'Can manage platform configurations and users'),
('moderator', 'Can moderate user-generated content'),
('student', 'Standard user with basic access')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.permissions (resource, action, description) VALUES
('users', 'create', 'Can create users'),
('users', 'read', 'Can read user profiles'),
('users', 'update', 'Can update user profiles'),
('users', 'delete', 'Can delete users'),
('users', 'export', 'Can export user data to CSV'),
('roles', 'manage', 'Can assign and modify roles'),
('announcements', 'create', 'Can create global announcements'),
('announcements', 'update', 'Can edit global announcements'),
('announcements', 'delete', 'Can delete global announcements'),
('surveys', 'manage', 'Can create, edit, and delete surveys')
ON CONFLICT (resource, action) DO NOTHING;

-- Map Permissions to Roles (Super Admin inherently has all via code, but we can map others here)
DO $$
DECLARE
  v_admin_id UUID;
  v_moderator_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM public.roles WHERE name = 'admin';
  SELECT id INTO v_moderator_id FROM public.roles WHERE name = 'moderator';

  IF v_admin_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT v_admin_id, id FROM public.permissions
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_moderator_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT v_moderator_id, id FROM public.permissions 
    WHERE resource IN ('announcements', 'surveys')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 5. Insert Badges
INSERT INTO public.badges (name, description, points_required) VALUES
('Early Adopter', 'Joined Universe during the Alpha phase', 0),
('Referral King', 'Referred 10 or more active students', 1000),
('Survey Master', 'Completed 5 daily polls in a row', 250)
ON CONFLICT (name) DO NOTHING;

-- 6. Insert a Sample Survey (Fake Door Validation)
INSERT INTO public.surveys (title, description, points_reward, is_active) VALUES
('Module Voting', 'Vote on which module we should build next', 50, true)
ON CONFLICT DO NOTHING;

-- Assuming the survey got created, we insert a question for it (using a subquery)
INSERT INTO public.survey_questions (survey_id, question_text, question_type, options, order_index)
SELECT id, 'Which module is most important to you?', 'multiple_choice', '["Marketplace", "Study Hub", "Errands", "Housing"]'::jsonb, 1
FROM public.surveys WHERE title = 'Module Voting'
ON CONFLICT DO NOTHING;
