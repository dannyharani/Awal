CREATE OR REPLACE FUNCTION public.get_random_word()
  RETURNS SETOF public.headwords
  LANGUAGE sql
  AS $function$
  select * from public.headwords
  order by random()
  limit 1;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_random_word"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."get_random_word"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."get_random_word"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_random_word"() TO "postgres";
