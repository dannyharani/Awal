CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
DECLARE
  -- Name variables
  meta_full_name text;
  safe_first_name text;
  safe_last_name text;
  
  -- Username variables
  base_username text;
  final_username text;
  username_collision boolean;
BEGIN
  -- Fetch the Full Name first
  meta_full_name := new.raw_user_meta_data ->> 'full_name';

  -- ---------------------------------------------------------
  -- LOGIC FOR FIRST/LAST NAME (Your existing logic)
  -- ---------------------------------------------------------
  safe_first_name := COALESCE(
    new.raw_user_meta_data ->> 'given_name',
    new.raw_user_meta_data ->> 'first_name',
    split_part(meta_full_name, ' ', 1),
    'AmazighUser' 
  );

  safe_last_name := COALESCE(
    new.raw_user_meta_data ->> 'family_name',
    new.raw_user_meta_data ->> 'last_name',
    TRIM(SUBSTRING(meta_full_name FROM POSITION(' ' IN meta_full_name) + 1)),
    '' 
  );

  -- ---------------------------------------------------------
  -- LOGIC FOR UNIQUE, SPACE-FREE USERNAME
  -- ---------------------------------------------------------
  
  -- 1. Determine a "Base" Username
  -- Priority: Full Name -> Email prefix (part before @)
  base_username := COALESCE(
    meta_full_name, 
    split_part(new.email, '@', 1)
  );

  -- 2. Slugify: Lowercase and remove anything that isn't a letter or number
  -- This effectively removes spaces, emojis, and punctuation
  base_username := lower(regexp_replace(base_username, '[^a-zA-Z0-9]', '', 'g'));

  -- 3. Edge Case: If the username is now empty (e.g. name was "!!!"), fallback to email prefix
  IF length(base_username) < 1 THEN
     base_username := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9]', '', 'g'));
  END IF;

  -- 4. Check for Uniqueness and Append Random Number if Taken
  final_username := base_username;
  LOOP
    -- Check if this username already exists in the profiles table
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE username = final_username)
    INTO username_collision;

    -- If no collision, break the loop, we are good to go!
    EXIT WHEN NOT username_collision;

    -- If there is a collision, append a random 4-digit number and try again
    -- Example: 'john' becomes 'john4829'
    final_username := base_username || floor(random() * 10000)::text;
  END LOOP;

  -- ---------------------------------------------------------
  -- INSERTION
  -- ---------------------------------------------------------
  INSERT INTO public.profiles (id, username, first_name, last_name, avatar_url, role)
  VALUES (
    new.id,
    final_username, -- Use the generated unique name
    safe_first_name,
    safe_last_name,
    new.raw_user_meta_data ->> 'avatar_url',
    'user'
  );
  
  RETURN new;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "postgres";
