CREATE TABLE "public"."profiles" (
  "id"                uuid                     NOT NULL,
  "username"          text                     NOT NULL,
  "reputation_points" integer                  DEFAULT 0,
  "role"              text                     DEFAULT 'user'::text,
  "created_at"        timestamp with time zone DEFAULT now(),
  "first_name"        text,
  "last_name"         text,
  "avatar_url"        text,
  "bio"               text,
  "preferred_locale"  text                     NOT NULL DEFAULT '''en''::text'::text,
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "profiles_role_check" CHECK ((role = ANY (ARRAY['user'::text, 'moderator'::text, 'instructor'::text, 'admin'::text]))),
  CONSTRAINT "profiles_username_key" UNIQUE (username)
);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "service_role";

REVOKE ALL ON TABLE "public"."profiles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres";
