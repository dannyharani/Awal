CREATE OR REPLACE FUNCTION public.get_dictionary_stats()
  RETURNS TABLE (
    total_words       bigint,
    total_definitions bigint
  )
  LANGUAGE plpgsql
  AS $function$
begin
    return query select 
        (select count(*) from headwords) as total_words,
        (select count(*) from definitions) as total_definitions;
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_dictionary_stats"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."get_dictionary_stats"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."get_dictionary_stats"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_dictionary_stats"() TO "postgres";
