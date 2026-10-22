
#!/bin/bash
set -e

echo "Restoring NaanNow database from backup..."

mongorestore \
  --gzip \
  --archive=/docker-entrypoint-initdb.d/naannow-data.archive.gz \
  --nsInclude="naannow.*"

echo "NaanNow database restore completed."
