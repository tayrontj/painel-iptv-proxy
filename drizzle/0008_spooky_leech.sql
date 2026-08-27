CREATE TABLE "playback_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"consumer_key_hash" varchar(64) NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "playback_sessions_customer_consumer_unique" ON "playback_sessions" USING btree ("customer_id","consumer_key_hash");--> statement-breakpoint
CREATE INDEX "playback_sessions_active_lookup" ON "playback_sessions" USING btree ("customer_id","expires_at");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION videlis_acquire_playback_session(
  p_customer_id integer,
  p_consumer_key_hash varchar(64),
  p_lease_seconds integer
)
RETURNS TABLE(allowed boolean, active_sessions integer, screen_limit integer, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_screen_limit integer;
  v_active_sessions integer;
  v_expires_at timestamptz;
  v_lease_seconds integer := GREATEST(30, LEAST(COALESCE(p_lease_seconds, 120), 900));
BEGIN
  SELECT screen_limit
    INTO v_screen_limit
    FROM customers
   WHERE id = p_customer_id
   FOR UPDATE;

  IF v_screen_limit IS NULL THEN
    RETURN QUERY SELECT false, 0, 0, NULL::timestamptz;
    RETURN;
  END IF;

  DELETE FROM playback_sessions
   WHERE customer_id = p_customer_id
     AND expires_at <= NOW();

  v_expires_at := NOW() + (v_lease_seconds * INTERVAL '1 second');

  -- Renova o consumidor existente antes de conferir capacidade. Uma sessão já
  -- ativa não é removida nem recusada por novas tentativas na mesma conta.
  UPDATE playback_sessions
     SET last_seen_at = NOW(), expires_at = v_expires_at
   WHERE customer_id = p_customer_id
     AND consumer_key_hash = p_consumer_key_hash;

  IF NOT FOUND THEN
    SELECT COUNT(*)::integer
      INTO v_active_sessions
      FROM playback_sessions
     WHERE customer_id = p_customer_id
       AND expires_at > NOW();

    IF v_active_sessions >= v_screen_limit THEN
      RETURN QUERY SELECT false, v_active_sessions, v_screen_limit, NULL::timestamptz;
      RETURN;
    END IF;

    INSERT INTO playback_sessions (customer_id, consumer_key_hash, last_seen_at, expires_at)
    VALUES (p_customer_id, p_consumer_key_hash, NOW(), v_expires_at);
  END IF;

  SELECT COUNT(*)::integer
    INTO v_active_sessions
    FROM playback_sessions
   WHERE customer_id = p_customer_id
     AND expires_at > NOW();

  RETURN QUERY SELECT true, v_active_sessions, v_screen_limit, v_expires_at;
END;
$$;
