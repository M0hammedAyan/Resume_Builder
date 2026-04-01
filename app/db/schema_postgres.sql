-- CareerOS PostgreSQL schema
-- Design layers:
-- 1) raw_events: unmodified user input
-- 2) structured_events: parsed intelligence
-- 3) derived data: scores, decisions, outputs, embeddings

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT UNIQUE,
    experience_level TEXT,
    target_roles TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE users IS 'User profile and targeting preferences for CareerOS.';


CREATE TABLE IF NOT EXISTS raw_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    raw_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE raw_events IS 'Raw user-provided event text preserved for traceability and reprocessing.';


CREATE TABLE IF NOT EXISTS structured_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    raw_event_id UUID NOT NULL REFERENCES raw_events(id) ON DELETE CASCADE,

    timestamp TIMESTAMPTZ NOT NULL,
    role_context TEXT NOT NULL,
    domain TEXT NOT NULL,

    action TEXT NOT NULL,
    tools TEXT[] DEFAULT '{}',

    impact_metric TEXT NOT NULL,
    impact_value DOUBLE PRECISION NOT NULL,
    impact_improvement TEXT NOT NULL,

    evidence TEXT,
    confidence DOUBLE PRECISION NOT NULL CHECK (confidence >= 0 AND confidence <= 1),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE structured_events IS 'Parsed event intelligence used for ranking, retrieval, and generation.';


CREATE TABLE IF NOT EXISTS event_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES structured_events(id) ON DELETE CASCADE,
    job_hash TEXT NOT NULL,

    relevance DOUBLE PRECISION NOT NULL,
    impact DOUBLE PRECISION NOT NULL,
    recency DOUBLE PRECISION NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    total_score DOUBLE PRECISION NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (event_id, job_hash)
);

COMMENT ON TABLE event_scores IS 'Cached score breakdown per event and job hash to avoid expensive recomputation.';


CREATE TABLE IF NOT EXISTS generated_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    job_description TEXT NOT NULL,
    output_type TEXT NOT NULL,

    content JSONB NOT NULL,
    ats_score DOUBLE PRECISION,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE generated_outputs IS 'Persisted generated artifacts (resume/linkedin/cover) and evaluation metrics.';


CREATE TABLE IF NOT EXISTS decision_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES structured_events(id) ON DELETE CASCADE,
    job_hash TEXT NOT NULL,

    decision TEXT NOT NULL,

    relevance DOUBLE PRECISION NOT NULL,
    impact DOUBLE PRECISION NOT NULL,
    recency DOUBLE PRECISION NOT NULL,

    reason TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE decision_logs IS 'Audit trail for include/exclude decisions with score rationale.';


CREATE TABLE IF NOT EXISTS event_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL UNIQUE REFERENCES structured_events(id) ON DELETE CASCADE,
    embedding vector(384) NOT NULL,
    model_name TEXT NOT NULL DEFAULT 'all-MiniLM-L6-v2',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE event_embeddings IS 'Vector representations of structured events for semantic retrieval.';


CREATE TABLE IF NOT EXISTS job_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_hash TEXT NOT NULL UNIQUE,
    job_description TEXT NOT NULL,
    embedding vector(384) NOT NULL,
    model_name TEXT NOT NULL DEFAULT 'all-MiniLM-L6-v2',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE job_embeddings IS 'Vector representations of job descriptions for retrieval and matching.';


-- Required indexes
CREATE INDEX IF NOT EXISTS idx_raw_events_user_id ON raw_events(user_id);
CREATE INDEX IF NOT EXISTS idx_structured_events_user_id ON structured_events(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_outputs_user_id ON generated_outputs(user_id);

CREATE INDEX IF NOT EXISTS idx_event_scores_job_hash ON event_scores(job_hash);
CREATE INDEX IF NOT EXISTS idx_decision_logs_job_hash ON decision_logs(job_hash);
CREATE INDEX IF NOT EXISTS idx_job_embeddings_job_hash ON job_embeddings(job_hash);

-- Vector similarity indexes (pgvector + ivfflat)
CREATE INDEX IF NOT EXISTS idx_event_embeddings_ivfflat
    ON event_embeddings
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_job_embeddings_ivfflat
    ON job_embeddings
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);


-- Optional full-text index to support hybrid retrieval keyword component
CREATE INDEX IF NOT EXISTS idx_structured_events_action_fts
    ON structured_events
    USING GIN (to_tsvector('english',
        coalesce(action, '') || ' ' ||
        coalesce(domain, '') || ' ' ||
        coalesce(role_context, '') || ' ' ||
        coalesce(impact_metric, '') || ' ' ||
        coalesce(impact_improvement, '') || ' ' ||
        coalesce(array_to_string(tools, ' '), '')
    ));


-- Advanced upgrade 1: Time decay function (DB-side)
-- recency_score = EXP(-lambda * age_in_days)
CREATE OR REPLACE FUNCTION recency_score(
    event_ts TIMESTAMPTZ,
    reference_ts TIMESTAMPTZ DEFAULT NOW(),
    lambda DOUBLE PRECISION DEFAULT 0.01
)
RETURNS DOUBLE PRECISION
LANGUAGE SQL
STABLE
AS $$
    SELECT EXP(
        -lambda * GREATEST(EXTRACT(EPOCH FROM (reference_ts - event_ts)) / 86400.0, 0)
    );
$$;


-- Advanced upgrade 2: Materialized view for fast retrieval
-- Precompute top events per user and role context using average cached score.
CREATE MATERIALIZED VIEW IF NOT EXISTS top_events AS
WITH ranked AS (
    SELECT
        se.user_id,
        se.role_context,
        se.id AS event_id,
        se.action,
        se.domain,
        AVG(es.total_score) AS avg_total_score,
        MAX(es.created_at) AS last_scored_at,
        ROW_NUMBER() OVER (
            PARTITION BY se.user_id, se.role_context
            ORDER BY AVG(es.total_score) DESC, MAX(es.created_at) DESC
        ) AS rn
    FROM structured_events se
    JOIN event_scores es ON es.event_id = se.id
    GROUP BY se.user_id, se.role_context, se.id, se.action, se.domain
)
SELECT
    user_id,
    role_context,
    event_id,
    action,
    domain,
    avg_total_score,
    last_scored_at
FROM ranked
WHERE rn <= 20;

CREATE UNIQUE INDEX IF NOT EXISTS idx_top_events_unique
    ON top_events(user_id, role_context, event_id);


-- Advanced upgrade 3: Hybrid retrieval (vector + keyword)
CREATE OR REPLACE FUNCTION hybrid_retrieve_events(
    p_user_id UUID,
    p_query_text TEXT,
    p_query_embedding vector(384),
    p_reference_ts TIMESTAMPTZ DEFAULT NOW(),
    p_lambda DOUBLE PRECISION DEFAULT 0.01,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    event_id UUID,
    role_context TEXT,
    domain TEXT,
    action TEXT,
    vector_score DOUBLE PRECISION,
    keyword_score DOUBLE PRECISION,
    recency_component DOUBLE PRECISION,
    hybrid_score DOUBLE PRECISION
)
LANGUAGE SQL
STABLE
AS $$
    WITH q AS (
        SELECT plainto_tsquery('english', COALESCE(p_query_text, '')) AS query
    )
    SELECT
        se.id AS event_id,
        se.role_context,
        se.domain,
        se.action,
        (1 - (ee.embedding <=> p_query_embedding)) AS vector_score,
        ts_rank_cd(
            to_tsvector('english',
                coalesce(se.action, '') || ' ' ||
                coalesce(se.domain, '') || ' ' ||
                coalesce(se.role_context, '') || ' ' ||
                coalesce(se.impact_metric, '') || ' ' ||
                coalesce(se.impact_improvement, '') || ' ' ||
                coalesce(array_to_string(se.tools, ' '), '')
            ),
            (SELECT query FROM q)
        ) AS keyword_score,
        recency_score(se.timestamp, p_reference_ts, p_lambda) AS recency_component,
        (
            0.65 * (1 - (ee.embedding <=> p_query_embedding)) +
            0.25 * ts_rank_cd(
                to_tsvector('english',
                    coalesce(se.action, '') || ' ' ||
                    coalesce(se.domain, '') || ' ' ||
                    coalesce(se.role_context, '') || ' ' ||
                    coalesce(se.impact_metric, '') || ' ' ||
                    coalesce(se.impact_improvement, '') || ' ' ||
                    coalesce(array_to_string(se.tools, ' '), '')
                ),
                (SELECT query FROM q)
            ) +
            0.10 * recency_score(se.timestamp, p_reference_ts, p_lambda)
        ) AS hybrid_score
    FROM structured_events se
    JOIN event_embeddings ee ON ee.event_id = se.id
    WHERE se.user_id = p_user_id
    ORDER BY hybrid_score DESC
    LIMIT p_limit;
$$;

-- For concurrent refresh in production:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY top_events;
