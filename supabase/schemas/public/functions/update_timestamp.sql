CREATE OR REPLACE FUNCTION public.update_timestamp()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."update_timestamp"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."update_timestamp"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."update_timestamp"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."update_timestamp"() TO "postgres";
