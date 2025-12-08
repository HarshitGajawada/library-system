#!/bin/sh
set -e

echo "🔄 Waiting for database..."
until npx prisma db push --skip-generate 2>/dev/null || false; do
  echo "⏳ Database not ready, retrying in 2s..."
  sleep 2
done

echo "✅ Database ready!"

echo "🔄 Running migrations..."
npx prisma migrate deploy || {
  echo "❌ Migration failed!"
  exit 1
}

echo "🌱 Running seed (if needed)..."
node prisma/dist/seed.js 2>/dev/null || echo "⚠️  Seed skipped (already seeded or failed)"

echo "🚀 Starting application..."
exec node dist/src/main