import { prisma } from "@/lib/prisma";

export async function notify(
  userId: string,
  type: string,
  message: string,
  link?: string
) {
  return prisma.notification.create({
    data: { userId, type, message, link },
  });
}
