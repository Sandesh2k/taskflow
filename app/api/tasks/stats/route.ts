import { getSafeSession } from "@/lib/auth";
import { getTaskStatsForUser } from "@/lib/task-stats";

export async function GET() {
  const session = await getSafeSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getTaskStatsForUser(session.user.id);
  return Response.json(stats);
}
