import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EditResourceForm from "@/components/EditResourceForm";

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const resource = await prisma.resource.findUnique({
    where: { id },
    include: { unavailableRanges: { orderBy: { startDate: "asc" } } },
  });
  if (!resource) notFound();
  if (resource.providerId !== session.user.id) redirect(`/resources/${id}`);

  return <EditResourceForm resource={resource} />;
}
