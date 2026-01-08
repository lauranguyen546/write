#!/bin/bash

# Create database directory
mkdir -p prisma

# Initialize SQLite database with schema
sqlite3 prisma/dev.db << 'EOF'
CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "settingsJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Manuscript" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Chunk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "manuscriptId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "chapter" TEXT,
    "scene" TEXT,
    "startChar" INTEGER NOT NULL,
    "endChar" INTEGER NOT NULL,
    "summaryJson" TEXT,
    FOREIGN KEY ("manuscriptId") REFERENCES "Manuscript"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Issue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "chunkId" TEXT,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" TEXT,
    "suggestion" TEXT,
    "startChar" INTEGER,
    "endChar" INTEGER,
    "tagsJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE,
    FOREIGN KEY ("chunkId") REFERENCES "Chunk"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "Revision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "issueId" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "suggestedText" TEXT NOT NULL,
    "diffJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "resultJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Manuscript_projectId_idx" ON "Manuscript"("projectId");
CREATE INDEX IF NOT EXISTS "Chunk_manuscriptId_idx" ON "Chunk"("manuscriptId");
CREATE INDEX IF NOT EXISTS "Issue_projectId_idx" ON "Issue"("projectId");
CREATE INDEX IF NOT EXISTS "Issue_chunkId_idx" ON "Issue"("chunkId");
CREATE INDEX IF NOT EXISTS "Revision_issueId_idx" ON "Revision"("issueId");
CREATE INDEX IF NOT EXISTS "Job_projectId_idx" ON "Job"("projectId");
EOF

echo "Database initialized successfully!"
