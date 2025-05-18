"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type Item = { name: string; url: string; icon: React.ElementType };

interface Props {
  label: string;
  icon: string;
  items: Item[];
  selectedProject: string;
}

const SidebarGroupSection = ({
  label,
  icon,
  items,
  selectedProject,
}: Props) => {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        <span className="text-md mr-1">{icon}</span>
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild>
                <Link
                  href={`/dashboard/${selectedProject}/${item.url}`}
                  className={cn(
                    {
                      "!dark:bg-brand-blue-700 bg-brand-blue-500 text-white":
                        pathname ===
                        `/dashboard/${selectedProject}/${item.url}`,
                    },
                    "list-none text-sm hover:bg-foundation-blue-600 hover:text-black hover:dark:bg-foundation-blue-800 hover:dark:text-neutral-50 focus:dark:bg-foundation-blue-600 focus:dark:text-neutral-50",
                  )}
                >
                  <item.icon />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default SidebarGroupSection;
