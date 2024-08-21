BEGIN;

CREATE TABLE IF NOT EXISTS stock_data_by_minute (
    symbol VARCHAR(255) NOT NULL
    , open_price DOUBLE PRECISION NOT NULL
    , high_price DOUBLE PRECISION NOT NULL
    , low_price DOUBLE PRECISION NOT NULL
    , close_price DOUBLE PRECISION NOT NULL
    , volume BIGINT NOT NULL
    , created_at TIMESTAMPTZ
);

CREATE OR REPLACE FUNCTION create_hypertable_if_not_exists(
    table_name TEXT,
    time_column_name TEXT,
    chunk_time_interval INTERVAL,
    partitioning_column TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    hypertable_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM timescaledb_information.hypertables
        WHERE hypertable_name = table_name
    ) INTO hypertable_exists;

    IF NOT hypertable_exists THEN
        PERFORM create_hypertable(
            table_name,
            time_column_name,
            chunk_time_interval => chunk_time_interval,
            partitioning_column => partitioning_column
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

SELECT create_hypertable_if_not_exists('stock_data_by_minute', 'created_at', '1 minute');

CREATE INDEX IF NOT EXISTS stock_data_by_minute_symbol_created_at_idx ON stock_data_by_minute (symbol, created_at);

COMMIT;