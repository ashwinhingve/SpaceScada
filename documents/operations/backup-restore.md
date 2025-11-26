# Backup and Restore Procedures

This document outlines backup and restore procedures for the WebSCADA system to ensure data integrity and disaster recovery capabilities.

## Overview

WebSCADA uses a multi-layered backup strategy:

1. **Database Backups**: PostgreSQL full and incremental backups
2. **Time-Series Data**: InfluxDB snapshots
3. **Cache Data**: Redis persistence (AOF + RDB)
4. **Configuration**: K3s ConfigMaps and Secrets
5. **Application State**: Persistent Volume snapshots

## Backup Strategy

### Backup Schedule

| Component    | Frequency        | Retention | Method           |
|-------------|------------------|-----------|------------------|
| PostgreSQL  | Daily (full)     | 30 days   | pg_dump          |
| PostgreSQL  | Hourly (WAL)     | 7 days    | WAL archiving    |
| InfluxDB    | Weekly (full)    | 90 days   | Backup API       |
| Redis       | Every 6 hours    | 7 days    | RDB + AOF        |
| PV Snapshots| Daily            | 14 days   | Storage provider |
| Config      | On change        | Unlimited | Git repository   |

### Backup Locations

**Primary Backup Storage:**
```
/backups/
├── postgresql/
│   ├── daily/
│   │   └── backup-2025-11-25.dump
│   └── wal/
│       └── 00000001000000000000000F
├── influxdb/
│   └── weekly/
│       └── backup-2025-11-20.tar.gz
├── redis/
│   └── dump-2025-11-25-12-00.rdb
└── k3s/
    ├── configmaps/
    └── secrets/
```

**Off-site Backup:** S3-compatible storage (AWS S3, MinIO, etc.)

## PostgreSQL Backup

### Full Database Backup

**Manual Backup:**
```bash
# Inside K3s cluster
kubectl exec -it postgresql-0 -n webscada -- \
  pg_dump -U webscada -Fc webscada > /backups/postgresql/backup-$(date +%Y-%m-%d).dump

# From external host
pg_dump -h postgres-host -U webscada -Fc webscada > backup.dump
```

**Automated Backup (CronJob):**
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgresql-backup
  namespace: webscada-dev
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:16
            command:
            - /bin/bash
            - -c
            - |
              pg_dump -h postgresql -U webscada -Fc webscada > \
              /backups/backup-$(date +%Y-%m-%d).dump
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgresql-secret
                  key: password
            volumeMounts:
            - name: backup-storage
              mountPath: /backups
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
```

### WAL (Write-Ahead Log) Archiving

**Enable WAL archiving in PostgreSQL:**
```sql
-- postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backups/postgresql/wal/%f'
max_wal_senders = 3
```

**Benefits:**
- Point-in-time recovery (PITR)
- Minimal data loss (seconds, not hours)
- Incremental backups

### PostgreSQL Restore

**Full Restore:**
```bash
# Stop all services accessing the database
kubectl scale deployment backend --replicas=0 -n webscada

# Restore from dump
kubectl exec -it postgresql-0 -n webscada -- \
  pg_restore -U webscada -d webscada -c /backups/backup-2025-11-25.dump

# Or drop and recreate database
kubectl exec -it postgresql-0 -n webscada -- psql -U webscada -c "DROP DATABASE webscada;"
kubectl exec -it postgresql-0 -n webscada -- psql -U webscada -c "CREATE DATABASE webscada;"
kubectl exec -it postgresql-0 -n webscada -- \
  pg_restore -U webscada -d webscada /backups/backup-2025-11-25.dump

# Restart services
kubectl scale deployment backend --replicas=3 -n webscada
```

**Point-in-Time Recovery (PITR):**
```bash
# 1. Restore base backup
pg_restore -U webscada -d webscada /backups/backup-2025-11-20.dump

# 2. Create recovery configuration
cat > recovery.conf <<EOF
restore_command = 'cp /backups/postgresql/wal/%f %p'
recovery_target_time = '2025-11-25 14:30:00'
EOF

# 3. Start PostgreSQL in recovery mode
pg_ctl start -D /var/lib/postgresql/data
```

## InfluxDB Backup

### Full Backup

**Manual Backup:**
```bash
# Using InfluxDB CLI
kubectl exec -it influxdb-0 -n webscada -- \
  influx backup /backups/influxdb/backup-$(date +%Y-%m-%d)

# Compress backup
kubectl exec -it influxdb-0 -n webscada -- \
  tar -czf /backups/influxdb/backup-$(date +%Y-%m-%d).tar.gz \
  /backups/influxdb/backup-$(date +%Y-%m-%d)
```

**Using InfluxDB API:**
```bash
# Backup to local file
curl -X POST http://influxdb:8086/api/v2/backup \
  -H "Authorization: Token your-token" \
  --data-binary @backup-config.json \
  > backup.tar.gz
```

### InfluxDB Restore

```bash
# Extract backup
tar -xzf backup-2025-11-25.tar.gz

# Restore
kubectl exec -it influxdb-0 -n webscada -- \
  influx restore /backups/influxdb/backup-2025-11-25

# Or using API
curl -X POST http://influxdb:8086/api/v2/restore \
  -H "Authorization: Token your-token" \
  --data-binary @backup.tar.gz
```

## Redis Backup

### RDB Snapshots

**Manual Snapshot:**
```bash
# Trigger immediate snapshot
kubectl exec -it redis-0 -n webscada -- redis-cli BGSAVE

# Copy RDB file
kubectl cp webscada/redis-0:/data/dump.rdb ./redis-backup-$(date +%Y-%m-%d).rdb
```

**Automated Snapshots (redis.conf):**
```
save 900 1      # Save after 15 minutes if at least 1 key changed
save 300 10     # Save after 5 minutes if at least 10 keys changed
save 60 10000   # Save after 1 minute if at least 10000 keys changed
```

### AOF (Append-Only File)

**Enable AOF:**
```
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
```

### Redis Restore

```bash
# 1. Stop Redis
kubectl scale statefulset redis --replicas=0 -n webscada

# 2. Copy backup file to Pod
kubectl cp redis-backup-2025-11-25.rdb webscada/redis-0:/data/dump.rdb

# 3. Start Redis
kubectl scale statefulset redis --replicas=1 -n webscada

# Redis will automatically load from dump.rdb on startup
```

## K3s Configuration Backup

### Backup ConfigMaps and Secrets

**Automated Export:**
```bash
#!/bin/bash
# backup-k8s-config.sh

NAMESPACE="webscada"
BACKUP_DIR="/backups/k3s/$(date +%Y-%m-%d)"

mkdir -p "$BACKUP_DIR"

# Export ConfigMaps
kubectl get configmap -n $NAMESPACE -o yaml > "$BACKUP_DIR/configmaps.yaml"

# Export Secrets (encrypted)
kubectl get secrets -n $NAMESPACE -o yaml > "$BACKUP_DIR/secrets.yaml"

# Encrypt secrets file
gpg --symmetric --cipher-algo AES256 "$BACKUP_DIR/secrets.yaml"
rm "$BACKUP_DIR/secrets.yaml"

# Export deployments
kubectl get deployments -n $NAMESPACE -o yaml > "$BACKUP_DIR/deployments.yaml"

# Export services
kubectl get services -n $NAMESPACE -o yaml > "$BACKUP_DIR/services.yaml"

# Export StatefulSets
kubectl get statefulsets -n $NAMESPACE -o yaml > "$BACKUP_DIR/statefulsets.yaml"
```

### Restore K3s Configuration

```bash
# Restore ConfigMaps
kubectl apply -f backups/k3s/2025-11-25/configmaps.yaml

# Decrypt and restore Secrets
gpg --decrypt backups/k3s/2025-11-25/secrets.yaml.gpg > secrets.yaml
kubectl apply -f secrets.yaml
rm secrets.yaml

# Restore other resources
kubectl apply -f backups/k3s/2025-11-25/deployments.yaml
kubectl apply -f backups/k3s/2025-11-25/services.yaml
kubectl apply -f backups/k3s/2025-11-25/statefulsets.yaml
```

## Persistent Volume Snapshots

### Create Volume Snapshot

**Using K3s VolumeSnapshot:**
```yaml
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: postgresql-snapshot-20251125
  namespace: webscada-dev
spec:
  volumeSnapshotClassName: csi-snapclass
  source:
    persistentVolumeClaimName: postgresql-pvc
```

**Create snapshot:**
```bash
kubectl apply -f postgresql-snapshot.yaml
```

### Restore from Volume Snapshot

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgresql-pvc-restored
  namespace: webscada-dev
spec:
  dataSource:
    name: postgresql-snapshot-20251125
    kind: VolumeSnapshot
    apiGroup: snapshot.storage.k8s.io
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
```

## Off-site Backup (S3)

### Upload to S3

**Using AWS CLI:**
```bash
# Upload PostgreSQL backup
aws s3 cp /backups/postgresql/backup-2025-11-25.dump \
  s3://webscada-backups/postgresql/backup-2025-11-25.dump

# Upload InfluxDB backup
aws s3 cp /backups/influxdb/backup-2025-11-25.tar.gz \
  s3://webscada-backups/influxdb/backup-2025-11-25.tar.gz

# Sync entire backup directory
aws s3 sync /backups/ s3://webscada-backups/
```

**Automated S3 Sync (CronJob):**
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: s3-backup-sync
  namespace: webscada-dev
spec:
  schedule: "0 3 * * *"  # Daily at 3 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: s3-sync
            image: amazon/aws-cli
            command:
            - /bin/bash
            - -c
            - aws s3 sync /backups/ s3://webscada-backups/
            env:
            - name: AWS_ACCESS_KEY_ID
              valueFrom:
                secretKeyRef:
                  name: aws-credentials
                  key: access-key-id
            - name: AWS_SECRET_ACCESS_KEY
              valueFrom:
                secretKeyRef:
                  name: aws-credentials
                  key: secret-access-key
            volumeMounts:
            - name: backup-storage
              mountPath: /backups
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
```

### Download from S3

```bash
# Download specific backup
aws s3 cp s3://webscada-backups/postgresql/backup-2025-11-25.dump \
  /backups/postgresql/backup-2025-11-25.dump

# Download all backups
aws s3 sync s3://webscada-backups/ /backups/
```

## Disaster Recovery Procedures

### Complete System Restore

**Prerequisites:**
- New K3s cluster provisioned
- Backup files accessible

**Steps:**

1. **Restore K3s Configuration:**
   ```bash
   kubectl create namespace webscada-dev
   kubectl apply -f backups/k3s/latest/configmaps.yaml
   kubectl apply -f backups/k3s/latest/secrets.yaml
   ```

2. **Deploy StatefulSets (databases):**
   ```bash
   kubectl apply -f backups/k3s/latest/statefulsets.yaml
   ```

3. **Wait for PostgreSQL to be ready:**
   ```bash
   kubectl wait --for=condition=ready pod/postgresql-0 -n webscada --timeout=300s
   ```

4. **Restore PostgreSQL data:**
   ```bash
   kubectl cp backups/postgresql/latest.dump webscada/postgresql-0:/tmp/
   kubectl exec -it postgresql-0 -n webscada -- \
     pg_restore -U webscada -d webscada -c /tmp/latest.dump
   ```

5. **Restore InfluxDB data:**
   ```bash
   kubectl cp backups/influxdb/latest.tar.gz webscada/influxdb-0:/tmp/
   kubectl exec -it influxdb-0 -n webscada -- \
     tar -xzf /tmp/latest.tar.gz -C /tmp/
   kubectl exec -it influxdb-0 -n webscada -- \
     influx restore /tmp/backup
   ```

6. **Restore Redis data:**
   ```bash
   kubectl cp backups/redis/latest.rdb webscada/redis-0:/data/dump.rdb
   kubectl rollout restart statefulset/redis -n webscada
   ```

7. **Deploy application services:**
   ```bash
   kubectl apply -f backups/k3s/latest/deployments.yaml
   kubectl apply -f backups/k3s/latest/services.yaml
   ```

8. **Verify all services:**
   ```bash
   kubectl get pods -n webscada
   kubectl get services -n webscada
   ```

9. **Run health checks:**
   ```bash
   curl http://backend-service/health
   curl http://frontend-service/health
   ```

## Backup Verification

### Automated Backup Testing

**Monthly Backup Restore Test:**
```bash
#!/bin/bash
# test-backup-restore.sh

# Create test namespace
kubectl create namespace webscada-dev-test

# Restore latest backup to test namespace
kubectl apply -f backups/k3s/latest/ -n webscada-test

# Wait for pods to be ready
kubectl wait --for=condition=ready pod --all -n webscada-test --timeout=600s

# Run smoke tests
kubectl exec -it postgresql-0 -n webscada-test -- psql -U webscada -c "SELECT COUNT(*) FROM devices;"

# Cleanup
kubectl delete namespace webscada-dev-test
```

### Backup Integrity Checks

```bash
# Verify PostgreSQL backup
pg_restore --list backup-2025-11-25.dump | wc -l

# Verify InfluxDB backup
tar -tzf backup-2025-11-25.tar.gz | wc -l

# Check backup file sizes
du -h /backups/postgresql/
du -h /backups/influxdb/
```

## Retention Policy

### Cleanup Old Backups

```bash
#!/bin/bash
# cleanup-old-backups.sh

# Keep only last 30 days of PostgreSQL backups
find /backups/postgresql/daily/ -name "backup-*.dump" -mtime +30 -delete

# Keep only last 90 days of InfluxDB backups
find /backups/influxdb/weekly/ -name "backup-*.tar.gz" -mtime +90 -delete

# Keep only last 7 days of Redis backups
find /backups/redis/ -name "dump-*.rdb" -mtime +7 -delete
```

## Monitoring Backups

### Backup Status Dashboard

Monitor backup health:
- Last successful backup time
- Backup file size trends
- Failed backup alerts
- Storage utilization

### Alerts

Configure alerts for:
- Backup failures
- Backup age > 48 hours
- Backup storage > 80% full
- S3 upload failures

## Troubleshooting

### Common Issues

**Backup fails with "disk full":**
- Check available storage: `df -h`
- Cleanup old backups
- Increase PVC size

**PostgreSQL restore fails:**
- Check PostgreSQL version compatibility
- Ensure database is empty or use `-c` flag
- Verify backup file integrity

**InfluxDB backup corrupted:**
- Check backup file with `tar -tzf`
- Verify storage I/O errors
- Test restore in isolated environment

---

**Last Updated**: 2025-11-25
