-- Preserve the pre-upgrade automatic pool once. New content has no membership rows.
-- Explicit sharing scopes on both the item and its library are respected.
CREATE TABLE content_rotation (
 organization_id CHAR(36) NOT NULL,
 location_id CHAR(36) NOT NULL,
 content_id CHAR(36) NOT NULL,
 enabled BOOLEAN NOT NULL DEFAULT 1,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(organization_id,location_id,content_id),
 FOREIGN KEY(organization_id,location_id) REFERENCES locations(organization_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO content_rotation(organization_id,location_id,content_id,enabled)
SELECT r.organization_id,l.id,r.id,1 FROM records r
JOIN locations l ON l.organization_id=r.organization_id AND l.enabled=1
JOIN records lib ON lib.organization_id=r.organization_id AND lib.kind='libraries'
 AND lib.id=JSON_UNQUOTE(JSON_EXTRACT(r.payload,'$.libraryId')) AND lib.archived=0
WHERE r.kind='items' AND r.archived=0
 AND (COALESCE(JSON_LENGTH(JSON_EXTRACT(r.payload,'$.locations')),0)=0 OR JSON_CONTAINS(JSON_EXTRACT(r.payload,'$.locations'),JSON_QUOTE(l.id)))
 AND (COALESCE(JSON_LENGTH(JSON_EXTRACT(lib.payload,'$.locations')),0)=0 OR JSON_CONTAINS(JSON_EXTRACT(lib.payload,'$.locations'),JSON_QUOTE(l.id)));
INSERT INTO schema_migrations(version) VALUES(5);
