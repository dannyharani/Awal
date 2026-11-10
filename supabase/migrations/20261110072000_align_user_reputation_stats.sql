-- Align get_user_profile_stats RPC to return authoritative profiles.reputation_points
CREATE OR REPLACE FUNCTION public.get_user_profile_stats (
  target_user_id uuid
)
  RETURNS TABLE (
    definition_count bigint,
    total_upvotes    bigint,
    reputation_score bigint
  )
  LANGUAGE plpgsql
  AS $function$
begin
  return query select 
    -- 1. How many definitions have they written?
    (select count(*) from definitions where user_id = target_user_id) as definition_count,
    
    -- 2. How many votes have they received total?
    (select coalesce(sum(vote_score), 0) from definitions where user_id = target_user_id) as total_upvotes,

    -- 3. The Authoritative Reputation Score (stored in profiles.reputation_points, falling back to karma calculation if null)
    (
      select coalesce(
        p.reputation_points,
        (select count(*) * 10 from definitions where user_id = target_user_id) +
        (select coalesce(sum(vote_score), 0) from definitions where user_id = target_user_id)
      )
      from profiles p
      where p.id = target_user_id
    ) as reputation_score;
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_user_profile_stats"(uuid) TO PUBLIC, "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_user_profile_stats"(uuid) TO "service_role";
REVOKE ALL ON FUNCTION "public"."get_user_profile_stats"(uuid) FROM "postgres";
GRANT EXECUTE ON FUNCTION "public"."get_user_profile_stats"(uuid) TO "postgres";
