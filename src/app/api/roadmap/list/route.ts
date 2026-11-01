import { NextResponse } from 'next/server';
import { asc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { roadmapPhases } from '@/lib/db/schema';

/** Feed público (sin auth) de fases de roadmap del ecosistema RPX/xLib, consumido por /roadmap. */
export async function GET() {
  const rows = await db
    .select({
      plugin: roadmapPhases.plugin,
      phaseName: roadmapPhases.phaseName,
      status: roadmapPhases.status,
      description: roadmapPhases.description,
      orderIndex: roadmapPhases.orderIndex,
      updatedAt: roadmapPhases.updatedAt,
    })
    .from(roadmapPhases)
    .orderBy(asc(roadmapPhases.plugin), asc(roadmapPhases.orderIndex));

  return NextResponse.json(rows);
}
