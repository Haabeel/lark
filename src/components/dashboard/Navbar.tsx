import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { type Session } from "@/lib/auth";
interface Props {
  session: Session | null | undefined;
  hasFetchingError: boolean;
  setHasFetchingError: React.Dispatch<React.SetStateAction<boolean>>;
  name: string;
}

const Navbar = ({
  name,
  session,
  hasFetchingError,
  setHasFetchingError,
}: Props) => {
  return (
    <div className="flex items-center gap-2 rounded-md border border-b-2 border-sidebar-border bg-sidebar p-2 px-4 shadow dark:border-none dark:bg-foundation-blue-700 dark:text-neutral-100">
      <div className="ml-auto"></div>
      <Avatar>
        {session?.user.image && hasFetchingError ? (
          <AvatarImage
            src={session?.user.image}
            key={session.user.id}
            onError={() => setHasFetchingError(true)}
          />
        ) : (
          <AvatarFallback className="bg-foundation-purple-300 dark:bg-foundation-purple-700">
            {name}
          </AvatarFallback>
        )}
      </Avatar>
    </div>
  );
};

export default Navbar;
