CREATE OR REPLACE FUNCTION public.search_dictionary (
  term text
)
  RETURNS TABLE (
    id            bigint,
    slug          text,
    headword_text text,
    similarity    real
  )
  LANGUAGE plpgsql
  AS $function$
begin
  return query
  select 
    h.id, 
    h.slug,
    h.script_latin as headword_text, 
    similarity(h.script_latin, term) as similarity
  from public.headwords h
  where 
    h.script_latin % term 
  order by 
    similarity desc
  limit 8;
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."search_dictionary"(text) TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."search_dictionary"(text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."search_dictionary"(text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."search_dictionary"(text) TO "postgres";
