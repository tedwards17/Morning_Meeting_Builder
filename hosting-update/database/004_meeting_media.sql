-- Meeting-only uploads stay private until confirmed completion, independently of dates.
ALTER TABLE media_assets
 ADD COLUMN scope VARCHAR(20) NOT NULL DEFAULT 'shared',
 ADD COLUMN meeting_id CHAR(36) NULL,
 ADD INDEX meeting_uploads (organization_id,meeting_id,scope,archived);
INSERT INTO schema_migrations(version) VALUES(4);
