import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Serves complaint photos privately. The resident who raised the complaint and managers of the
 * same society may view it; everyone else gets a 404.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Not found", { status: 404 });
  const { id } = await params;

  const attachment = await prisma.complaintAttachment.findFirst({
    where: {
      id,
      complaint: {
        societyId: user.societyId,
        ...(user.role === "RESIDENT" ? { residentId: user.id } : {}),
      },
    },
    select: { data: true, mimeType: true, size: true },
  });
  if (!attachment) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(attachment.data), {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Length": String(attachment.size),
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
    },
  });
}
