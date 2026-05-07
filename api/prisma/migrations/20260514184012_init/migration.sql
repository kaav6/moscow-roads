-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('ACCIDENT', 'WORKS', 'CLOSURE', 'CAMERA', 'WEATHER');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('HIGH', 'MED', 'LOW');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('ACTIVE', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "IncidentEventKind" AS ENUM ('CREATED', 'VERIFIED', 'DISPATCHED', 'ESCALATED', 'ACTION', 'RESOLVED', 'COMMENT');

-- CreateEnum
CREATE TYPE "FeedTag" AS ENUM ('EVENT', 'DISPATCH', 'CAMERA', 'INCIDENT', 'SENSOR', 'STATUS', 'WEATHER');

-- CreateEnum
CREATE TYPE "ResponderKind" AS ENUM ('DPS', 'AMBULANCE', 'TOW', 'INSPECTOR');

-- CreateEnum
CREATE TYPE "ResponderStatus" AS ENUM ('ACTIVE', 'EN_ROUTE', 'IDLE');

-- CreateEnum
CREATE TYPE "TimeOfDay" AS ENUM ('DAY', 'PEAK', 'NIGHT');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "shift" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" UUID NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "District" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 4.5,

    CONSTRAINT "District_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "type" "IncidentType" NOT NULL,
    "priority" "Priority" NOT NULL,
    "title" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "districtCode" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'ACTIVE',
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "acknowledgedBy" UUID,
    "resolvedBy" UUID,
    "source" TEXT,
    "injured" INTEGER,
    "lanes" TEXT,
    "avgSpeedKmh" INTEGER,
    "eta" TEXT,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentEvent" (
    "id" UUID NOT NULL,
    "incidentId" TEXT NOT NULL,
    "kind" "IncidentEventKind" NOT NULL,
    "comment" TEXT,
    "actorId" UUID,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Responder" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" "ResponderKind" NOT NULL,

    CONSTRAINT "Responder_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "IncidentResponder" (
    "id" UUID NOT NULL,
    "incidentId" TEXT NOT NULL,
    "responderCode" TEXT NOT NULL,
    "status" "ResponderStatus" NOT NULL DEFAULT 'IDLE',
    "eta" TEXT,

    CONSTRAINT "IncidentResponder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Camera" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "districtCode" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "online" BOOLEAN NOT NULL DEFAULT true,
    "rtspUrl" TEXT,

    CONSTRAINT "Camera_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "FeedEvent" (
    "id" SERIAL NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tag" "FeedTag" NOT NULL,
    "incidentId" TEXT,
    "message" TEXT NOT NULL,
    "meta" TEXT,

    CONSTRAINT "FeedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiSnapshot" (
    "id" SERIAL NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" DOUBLE PRECISION NOT NULL,
    "activeIncidents" INTEGER NOT NULL,
    "avgSpeedKmh" DOUBLE PRECISION NOT NULL,
    "camerasOnline" INTEGER NOT NULL,
    "timeOfDay" "TimeOfDay" NOT NULL DEFAULT 'DAY',

    CONSTRAINT "KpiSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JamSegment" (
    "id" SERIAL NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "districtCode" TEXT NOT NULL,
    "avgScore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "JamSegment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Incident_status_reportedAt_idx" ON "Incident"("status", "reportedAt" DESC);

-- CreateIndex
CREATE INDEX "Incident_districtCode_idx" ON "Incident"("districtCode");

-- CreateIndex
CREATE INDEX "Incident_type_idx" ON "Incident"("type");

-- CreateIndex
CREATE INDEX "IncidentEvent_incidentId_at_idx" ON "IncidentEvent"("incidentId", "at");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentResponder_incidentId_responderCode_key" ON "IncidentResponder"("incidentId", "responderCode");

-- CreateIndex
CREATE INDEX "Camera_districtCode_idx" ON "Camera"("districtCode");

-- CreateIndex
CREATE INDEX "FeedEvent_ts_idx" ON "FeedEvent"("ts" DESC);

-- CreateIndex
CREATE INDEX "KpiSnapshot_ts_idx" ON "KpiSnapshot"("ts" DESC);

-- CreateIndex
CREATE INDEX "JamSegment_districtCode_ts_idx" ON "JamSegment"("districtCode", "ts" DESC);

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_districtCode_fkey" FOREIGN KEY ("districtCode") REFERENCES "District"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_acknowledgedBy_fkey" FOREIGN KEY ("acknowledgedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentEvent" ADD CONSTRAINT "IncidentEvent_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentEvent" ADD CONSTRAINT "IncidentEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentResponder" ADD CONSTRAINT "IncidentResponder_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentResponder" ADD CONSTRAINT "IncidentResponder_responderCode_fkey" FOREIGN KEY ("responderCode") REFERENCES "Responder"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Camera" ADD CONSTRAINT "Camera_districtCode_fkey" FOREIGN KEY ("districtCode") REFERENCES "District"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedEvent" ADD CONSTRAINT "FeedEvent_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JamSegment" ADD CONSTRAINT "JamSegment_districtCode_fkey" FOREIGN KEY ("districtCode") REFERENCES "District"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
