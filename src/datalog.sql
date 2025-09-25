create table datalog (
    log_time timestamptz not null,
    log_user_id text,
	log_user_name text,
    log_action text,
    log_ipaddress text,
	log_module text,
	log_table text,
	log_id text,
	log_remark text,
	log_executiontime int,
    log_metadata JSONB
);

CREATE INDEX idx_datalog_module_table_id
ON datalog (log_module, log_table, log_id);


-- buat jadi hyper table
SELECT create_hypertable('datalog', 'log_time');


