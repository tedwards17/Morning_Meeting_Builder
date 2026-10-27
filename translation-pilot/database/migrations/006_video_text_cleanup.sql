-- One-time data cleanup requested by DTB. No saved-meeting payload is rewritten.
-- Run once after 001-005, before replacing public assets. Skip if version 6 is installed.
START TRANSACTION;
UPDATE organizations SET sequence=sequence;
CREATE TEMPORARY TABLE mmb_video_cleanup (
 ordinal BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 organization_id CHAR(36) NOT NULL,
 record_id CHAR(36) NOT NULL,
 new_version INT NOT NULL,
 base_sequence BIGINT UNSIGNED NOT NULL,
 new_payload JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO mmb_video_cleanup(organization_id,record_id,new_version,base_sequence,new_payload)
SELECT r.organization_id,r.id,r.version+1,o.sequence,
 JSON_SET(r.payload,'$.description','','$.summary','','$.version',r.version+1,'$.updatedAt',DATE_FORMAT(UTC_TIMESTAMP(),'%Y-%m-%dT%H:%i:%s.000Z'))
FROM records r JOIN organizations o ON o.id=r.organization_id
JOIN records lib ON lib.organization_id=r.organization_id AND lib.kind='libraries' AND lib.id=JSON_UNQUOTE(JSON_EXTRACT(r.payload,'$.libraryId'))
WHERE r.kind='items'
 AND (lib.id IN ('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000005') OR LOWER(JSON_UNQUOTE(JSON_EXTRACT(lib.payload,'$.name'))) IN ('safety','safety videos','lean','lean learning','lean videos'))
 AND (JSON_UNQUOTE(JSON_EXTRACT(r.payload,'$.type')) IN ('video','external-video') OR JSON_UNQUOTE(JSON_EXTRACT(r.payload,'$.url')) REGEXP '^https?://(www\\.)?(youtube\\.com/(watch|shorts/|embed/)|youtu\\.be/)')
 AND (COALESCE(JSON_UNQUOTE(JSON_EXTRACT(r.payload,'$.description')),'')<>'' OR COALESCE(JSON_UNQUOTE(JSON_EXTRACT(r.payload,'$.summary')),'')<>'');
INSERT INTO record_versions(organization_id,kind,record_id,version,payload,created_at)
SELECT organization_id,'items',record_id,new_version,new_payload,UTC_TIMESTAMP() FROM mmb_video_cleanup;
UPDATE records r JOIN mmb_video_cleanup c ON c.organization_id=r.organization_id AND c.record_id=r.id AND r.kind='items'
SET r.version=c.new_version,r.payload=c.new_payload,r.updated_at=UTC_TIMESTAMP();
INSERT INTO sync_changes(organization_id,sequence,kind,record_id)
SELECT organization_id,base_sequence+ordinal,'items',record_id FROM mmb_video_cleanup;
UPDATE organizations o JOIN (SELECT organization_id,MAX(base_sequence+ordinal) seq FROM mmb_video_cleanup GROUP BY organization_id) c ON c.organization_id=o.id SET o.sequence=c.seq;
DROP TEMPORARY TABLE mmb_video_cleanup;
INSERT INTO schema_migrations(version) VALUES(6);
COMMIT;
