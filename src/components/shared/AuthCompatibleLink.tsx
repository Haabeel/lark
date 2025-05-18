"use client";

import NextLink from "next/link";
import type { ReactNode, AnchorHTMLAttributes } from "react";
import React from "react";

// Define the props that AuthUIProvider's Link prop expects
export interface AuthLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string; // Explicitly string
  children: ReactNode;
  className?: string;
  // Add any other props AuthUIProvider's Link might pass, like 'target', 'rel', etc.
}

// Use React.forwardRef to correctly pass down refs if AuthUIProvider needs to attach one
const AuthCompatibleLink = React.forwardRef<HTMLAnchorElement, AuthLinkProps>(
  ({ href, children, className, ...rest }, ref) => {
    // next/link can take a string href.
    // If AuthUIProvider only ever passes string hrefs, this is fine.
    return (
      <NextLink href={href} passHref legacyBehavior>
        {/* legacyBehavior and passHref are often needed when wrapping next/link with an <a> or custom component */}
        <a ref={ref} className={className} {...rest}>
          {children}
        </a>
      </NextLink>
    );
  },
);

AuthCompatibleLink.displayName = "AuthCompatibleLink";

export default AuthCompatibleLink;
