import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface LocationParams {
  locationId: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: LocationParams }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { locationId } = params;

  try {
    // Get the location to verify permissions
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      include: { users: true, organization: { include: { members: true } } },
    });

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this location
    const hasAccess =
      location.users.some((user) => user.id === session.user.id) ||
      location.organization.members.some(
        (member) => member.id === session.user.id
      );

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse and validate the request body
    const data = await request.json();

    // Update the location settings
    const updatedLocation = await prisma.location.update({
      where: { id: locationId },
      data: {
        autoReplyEnabled: data.autoReplyEnabled,
        autoPostEnabled: data.autoPostEnabled,
        replyTonePreference: data.replyTonePreference,
      },
    });

    return NextResponse.json({
      success: true,
      location: {
        id: updatedLocation.id,
        name: updatedLocation.name,
        autoReplyEnabled: updatedLocation.autoReplyEnabled,
        autoPostEnabled: updatedLocation.autoPostEnabled,
        replyTonePreference: updatedLocation.replyTonePreference,
      },
    });
  } catch (error) {
    console.error("Failed to update location settings:", error);
    return NextResponse.json(
      { error: "Failed to update location settings" },
      { status: 500 }
    );
  }
}
