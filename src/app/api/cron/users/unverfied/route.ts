import { NextResponse } from "next/server";
import { db } from "@/server/db";

export const GET = async (request: Request) => {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.API_SECRET!}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const unverifiedUsers = await db.user.findMany({
      where: {
        emailVerified: false,
        createdAt: {
          lte: fifteenMinutesAgo,
        },
      },
      include: {
        accounts: true,
      },
    });

    let deletedUsers = 0;
    let deletedCredentialAccounts = 0;
    for (const user of unverifiedUsers) {
      const hasSocialAccounts = user.accounts.some(
        (account) => account.providerId !== "credentials",
      );

      if (hasSocialAccounts) {
        const credentialAccount = user.accounts.find(
          (account) => account.providerId === "credentials",
        );

        if (credentialAccount) {
          await db.account.delete({
            where: {
              id: credentialAccount.id,
            },
          });
          deletedCredentialAccounts++;
        }
      } else {
        await db.user.delete({
          where: {
            id: user.id,
          },
        });
        deletedUsers++;
      }
    }
    return NextResponse.json({
      message: `Deleted ${deletedUsers} unverified users and ${deletedCredentialAccounts} credential accounts`,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};
