-- Migration: 20261112160000_owner_and_moderation.sql
-- Adds 'owner' role, 'is_blocked' column, and promotes dannyharani@gmail.com (f5df0d80-dcca-46f8-8e30-069aee1a4917)

-- 1. Update the check constraint on profiles to allow 'owner'
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role = ANY (ARRAY['user'::text, 'moderator'::text, 'instructor'::text, 'admin'::text, 'owner'::text]));

-- 2. Add is_blocked column to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false;

-- 3. Update is_moderator_or_admin function to include 'owner'
CREATE OR REPLACE FUNCTION public.is_moderator_or_admin()
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
  STABLE
  AS $$
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('moderator', 'instructor', 'admin', 'owner')
        AND is_blocked = false
    );
  $$;

-- 3. Dedicated is_owner function
CREATE OR REPLACE FUNCTION public.is_owner()
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
  STABLE
  AS $$
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'owner'
        AND is_blocked = false
    );
  $$;

GRANT EXECUTE ON FUNCTION public.is_owner() TO PUBLIC, anon, authenticated, service_role;

-- 4. Update profile field protection:
-- - Only 'owner' or 'admin' can update roles
-- - Only 'owner' can assign the 'owner' or 'admin' role
-- - Nobody can demote or block the 'owner'
-- - Blocked users cannot update anything
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
DECLARE
  v_caller_role text;
  v_caller_is_blocked boolean;
BEGIN
  IF current_setting('role', true) = 'authenticated' THEN
    SELECT role, is_blocked INTO v_caller_role, v_caller_is_blocked
    FROM public.profiles
    WHERE id = auth.uid();

    -- Blocked caller cannot update any profile
    IF v_caller_is_blocked IS TRUE THEN
      RAISE EXCEPTION 'Account is blocked';
    END IF;

    -- If target was owner, nobody except owner themselves can change anything privileged
    IF OLD.role = 'owner' AND (v_caller_role IS DISTINCT FROM 'owner' OR auth.uid() != OLD.id) THEN
      NEW.role := OLD.role;
      NEW.is_blocked := OLD.is_blocked;
    END IF;

    -- Only owner can modify is_blocked
    IF NEW.is_blocked IS DISTINCT FROM OLD.is_blocked THEN
      IF v_caller_role IS DISTINCT FROM 'owner' THEN
        NEW.is_blocked := OLD.is_blocked;
      END IF;
    END IF;

    -- Role modifications:
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      IF v_caller_role = 'owner' THEN
        -- Owner can set any role
        NULL;
      ELSIF v_caller_role = 'admin' THEN
        -- Admin can only set moderator, instructor, user (cannot create owner or admin, cannot touch owner)
        IF NEW.role IN ('owner', 'admin') OR OLD.role IN ('owner', 'admin') THEN
          NEW.role := OLD.role;
        END IF;
      ELSE
        -- Normal users cannot change roles
        NEW.role := OLD.role;
      END IF;
    END IF;

    -- Reputation modifications: only admin or owner
    IF NEW.reputation_points IS DISTINCT FROM OLD.reputation_points THEN
      IF v_caller_role NOT IN ('owner', 'admin') THEN
        NEW.reputation_points := OLD.reputation_points;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 5. Disallow blocked users from adding definitions, examples, comments, votes
CREATE OR REPLACE FUNCTION public.check_user_not_blocked()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_blocked = true) THEN
    RAISE EXCEPTION 'Blocked users cannot contribute content';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_block_definitions ON public.definitions;
CREATE TRIGGER trigger_block_definitions
  BEFORE INSERT OR UPDATE ON public.definitions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_user_not_blocked();

DROP TRIGGER IF EXISTS trigger_block_comments ON public.definition_comments;
CREATE TRIGGER trigger_block_comments
  BEFORE INSERT OR UPDATE ON public.definition_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_user_not_blocked();

DROP TRIGGER IF EXISTS trigger_block_votes ON public.votes;
CREATE TRIGGER trigger_block_votes
  BEFORE INSERT OR UPDATE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_user_not_blocked();

-- 6. Set Danny as owner immediately
UPDATE public.profiles
SET role = 'owner', is_blocked = false
WHERE id = 'f5df0d80-dcca-46f8-8e30-069aee1a4917';
