CREATE OR REPLACE FUNCTION public.handle_vote_update()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
BEGIN
  -- TG_OP is visible here because we are inside the function
  -- and language is set to plpgsql below.

  -- 1. INSERT (New Vote)
  IF (TG_OP = 'INSERT') THEN
    IF NEW.definition_id IS NOT NULL THEN
      UPDATE definitions SET vote_score = vote_score + NEW.value WHERE id = NEW.definition_id;
    ELSIF NEW.example_id IS NOT NULL THEN
      UPDATE examples SET vote_score = vote_score + NEW.value WHERE id = NEW.example_id;
    END IF;
    RETURN NEW;

  -- 2. DELETE (Remove Vote)
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.definition_id IS NOT NULL THEN
      UPDATE definitions SET vote_score = vote_score - OLD.value WHERE id = OLD.definition_id;
    ELSIF OLD.example_id IS NOT NULL THEN
      UPDATE examples SET vote_score = vote_score - OLD.value WHERE id = OLD.example_id;
    END IF;
    RETURN OLD;

  -- 3. UPDATE (Change Vote)
  ELSIF (TG_OP = 'UPDATE') THEN
    IF NEW.definition_id IS NOT NULL THEN
      UPDATE definitions SET vote_score = vote_score - OLD.value + NEW.value WHERE id = NEW.definition_id;
    ELSIF NEW.example_id IS NOT NULL THEN
      UPDATE examples SET vote_score = vote_score - OLD.value + NEW.value WHERE id = NEW.example_id;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."handle_vote_update"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."handle_vote_update"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."handle_vote_update"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_vote_update"() TO "postgres";
