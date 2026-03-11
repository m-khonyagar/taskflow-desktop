use tauri_plugin_sql::{Migration, MigrationKind};

pub fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: "
                CREATE TABLE IF NOT EXISTS contacts (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL DEFAULT '',
                    phone TEXT NOT NULL,
                    notes TEXT NOT NULL DEFAULT '',
                    tags TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS platform_checks (
                    id TEXT PRIMARY KEY,
                    contact_id TEXT NOT NULL,
                    platform TEXT NOT NULL,
                    has_account INTEGER NOT NULL DEFAULT 0,
                    last_online TEXT,
                    checked_at TEXT NOT NULL,
                    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    contact_id TEXT NOT NULL,
                    platform TEXT NOT NULL,
                    content TEXT NOT NULL,
                    direction TEXT NOT NULL DEFAULT 'sent',
                    status TEXT NOT NULL DEFAULT 'pending',
                    scheduled_at TEXT,
                    sent_at TEXT,
                    created_at TEXT NOT NULL,
                    campaign_id TEXT,
                    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS campaigns (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    platform TEXT NOT NULL,
                    content TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'draft',
                    total_recipients INTEGER NOT NULL DEFAULT 0,
                    sent_count INTEGER NOT NULL DEFAULT 0,
                    seen_count INTEGER NOT NULL DEFAULT 0,
                    reply_count INTEGER NOT NULL DEFAULT 0,
                    rate_limit INTEGER NOT NULL DEFAULT 50,
                    interval_hours INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL,
                    started_at TEXT,
                    completed_at TEXT
                );

                CREATE TABLE IF NOT EXISTS campaign_recipients (
                    id TEXT PRIMARY KEY,
                    campaign_id TEXT NOT NULL,
                    contact_id TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending',
                    message_id TEXT,
                    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
                    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
                );
            ",
            kind: MigrationKind::Up,
        }
    ]
}
