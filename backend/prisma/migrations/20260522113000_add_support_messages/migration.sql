CREATE TABLE "support_messages" (
    "id" TEXT NOT NULL,
    "ticketCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "topic" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "support_messages_ticketCode_key" ON "support_messages"("ticketCode");
CREATE INDEX "support_messages_status_idx" ON "support_messages"("status");
CREATE INDEX "support_messages_topic_idx" ON "support_messages"("topic");
CREATE INDEX "support_messages_createdAt_idx" ON "support_messages"("createdAt");
