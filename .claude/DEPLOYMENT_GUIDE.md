# Redis Streams Migration - Deployment Guide

## Pre-Deployment Checklist

- [x] Code changes implemented and tested
- [x] Unit tests updated and passing (4/4)
- [x] Build successful with no TypeScript errors
- [ ] Environment variables configured
- [ ] Redis connection verified
- [ ] Backup strategy confirmed

## Environment Setup

### 1. Update .env file

Ensure your `.env` file contains the new configuration:

```bash
# Notifications (SSE)
NOTIFICATION_BLOCK_TIMEOUT=500
SSE_HEARTBEAT_PERIOD=30000
STREAM_MAX_LENGTH=500  # NEW - Add this line
```

### 2. Verify Redis Version

Redis Streams require Redis 5.0+. Check your version:

```bash
redis-cli INFO server | grep redis_version
```

Expected: `redis_version:5.0.0` or higher

## Deployment Steps

### Step 1: Pre-Deploy Cleanup (Optional)

Clear old list-based notification queues to avoid confusion:

```bash
# Connect to Redis
redis-cli

# Find and delete old list keys
SCAN 0 MATCH user:* COUNT 100
# Review the keys, then delete if safe:
# DEL user:1 user:2 user:3 ...

# Or use a script:
redis-cli --scan --pattern "user:*" | grep -v ":stream" | xargs redis-cli del
```

⚠️ **Warning**: This will delete pending notifications in old queues.

### Step 2: Deploy Application

```bash
# Build the application
npm run build

# Start the application
npm run start:prod

# Or with Docker
docker-compose up -d
```

### Step 3: Verify Deployment

#### Check Application Logs

Look for successful startup messages:

```bash
# Check logs
docker-compose logs -f app

# Expected: No errors related to Redis or STREAM_MAX_LENGTH
```

#### Verify Redis Stream Creation

```bash
redis-cli

# Check if streams are being created (after first notification)
SCAN 0 MATCH user:*:stream

# Example output:
# 1) "0"
# 2) 1) "user:1:stream"
#    2) "user:2:stream"
```

#### Check Stream Contents

```bash
# Check a specific user's stream
XLEN user:1:stream

# View stream entries
XRANGE user:1:stream - + COUNT 10

# Example output:
# 1) 1) "1678901234567-0"
#    2) 1) "data"
#       2) "{\"event\":\"BATTLE_START\",\"payload\":{...}}"
```

### Step 4: Test SSE Connection

#### Test with curl

```bash
# Connect to SSE endpoint (replace with valid JWT)
curl -N -H "Accept: text/event-stream" \
  "http://localhost:3000/api/notifications?token=YOUR_JWT_TOKEN"

# Expected: Heartbeat pings every 30 seconds
# data: {"event":"ping","payload":null}
```

#### Test Catch-Up Feature

1. Disconnect SSE client
2. Trigger a notification event (e.g., complete a todo)
3. Reconnect with `?lastId=<last-received-stream-id>`
4. Verify missed notifications are delivered

### Step 5: Monitor Performance

#### Check Redis Memory Usage

```bash
redis-cli INFO memory

# Key metrics:
# - used_memory_human: Total memory used
# - used_memory_peak_human: Peak memory usage
```

#### Monitor Stream Lengths

```bash
# Check all stream lengths
redis-cli --scan --pattern "user:*:stream" | while read key; do
  echo "$key: $(redis-cli XLEN $key)"
done

# Expected: Each stream should be ≤ 500 messages (STREAM_MAX_LENGTH)
```

#### Application Monitoring

Watch application logs for:
- `Added to stream <id>` - Notifications being added
- `Catching up from <id>` - Clients reconnecting with catch-up
- `XREAD error` - Any Redis Stream errors (should be rare)

## Rollback Plan

If critical issues arise:

### Step 1: Revert Code

```bash
# Find previous commit
git log --oneline -n 5

# Revert to previous commit (before migration)
git revert HEAD
# Or
git reset --hard <previous-commit-hash>

# Rebuild and redeploy
npm run build
npm run start:prod
```

### Step 2: Clean Up Stream Keys

```bash
redis-cli

# Delete all stream keys
SCAN 0 MATCH user:*:stream COUNT 100
# Review, then delete:
DEL user:1:stream user:2:stream ...

# Or with script:
redis-cli --scan --pattern "user:*:stream" | xargs redis-cli del
```

### Step 3: Verify Rollback

- Check application logs for successful startup
- Test SSE connections work
- Verify notifications are delivered

## Post-Deployment Tasks

### 1. Clean Up Old Keys (After 24-48 hours)

Once confirmed stable, remove orphaned list keys:

```bash
# Find old list keys (without :stream suffix)
redis-cli --scan --pattern "user:*" | grep -v ":stream"

# Delete them
redis-cli --scan --pattern "user:*" | grep -v ":stream" | xargs redis-cli del
```

### 2. Monitor for 48 Hours

Watch for:
- Memory leaks in Redis
- Stream lengths exceeding MAXLEN (should auto-trim)
- SSE connection issues
- Missed notification complaints from users

### 3. Tune Configuration (If Needed)

Based on actual usage patterns, adjust:

```bash
# In .env file:

# Increase if users report missing old notifications
STREAM_MAX_LENGTH=1000

# Decrease to reduce memory if streams are underutilized
STREAM_MAX_LENGTH=300

# Adjust timeout if SSE connections are unstable
NOTIFICATION_BLOCK_TIMEOUT=1000
```

## Troubleshooting

### Issue: "Cannot resolve STREAM_MAX_LENGTH"

**Solution**: Ensure `.env` file contains `STREAM_MAX_LENGTH=500`

### Issue: Clients not receiving notifications

**Diagnosis**:
```bash
# 1. Check if streams are being created
redis-cli SCAN 0 MATCH user:*:stream

# 2. Check if messages are being added
redis-cli XRANGE user:<userId>:stream - +

# 3. Check application logs for XREAD errors
```

**Solution**: Verify Redis version (5.0+), check network connectivity

### Issue: Memory usage increasing unexpectedly

**Diagnosis**:
```bash
# Check stream lengths
redis-cli --scan --pattern "user:*:stream" | while read key; do
  echo "$key: $(redis-cli XLEN $key)"
done
```

**Solution**:
- Verify MAXLEN is working (should trim at ~500)
- Reduce `STREAM_MAX_LENGTH` in `.env`
- Check for abandoned streams (inactive users)

### Issue: Catch-up not working

**Diagnosis**: Check if `lastId` parameter is being passed correctly

**Solution**:
- Verify client is sending `?lastId=<stream-id>` on reconnect
- Check logs for "Catching up from..." messages
- Verify stream IDs are valid format (`1678901234567-0`)

## Success Criteria

✅ All SSE clients receive notifications
✅ Reconnecting clients receive missed messages
✅ Redis memory usage is stable (≤ expected based on active users)
✅ No XREAD errors in logs
✅ Stream lengths are bounded by MAXLEN (≤ 500)
✅ Application logs show "Added to stream" messages

## Support

For issues or questions:
- Check application logs: `docker-compose logs -f app`
- Check Redis logs: `redis-cli MONITOR`
- Review this guide: `.claude/DEPLOYMENT_GUIDE.md`
- Review migration summary: `.claude/MIGRATION_SUMMARY.md`