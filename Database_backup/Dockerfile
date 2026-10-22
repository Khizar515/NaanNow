
FROM mongo:8.2

COPY naannow-data.archive.gz /docker-entrypoint-initdb.d/naannow-data.archive.gz
COPY restore.sh /docker-entrypoint-initdb.d/restore.sh

RUN chmod +x /docker-entrypoint-initdb.d/restore.sh