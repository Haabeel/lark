import SidebarGroupSection from "./SidebarGroupSection";
import { sidebarItems } from "./sidebarItems";
import { SidebarContent } from "@/components/ui/sidebar";

const SidebarAppPanel = ({
  selectedProject,
  open,
}: {
  selectedProject: string;
  open: boolean;
}) => {
  return (
    <SidebarContent className={open ? "" : "pt-3"}>
      <SidebarGroupSection
        label="AI Insights"
        icon="🚀"
        items={sidebarItems.ai}
        selectedProject={selectedProject}
      />
      <SidebarGroupSection
        label="Management"
        icon="🗂️"
        items={sidebarItems.management}
        selectedProject={selectedProject}
      />
      <SidebarGroupSection
        label="Me"
        icon="👤"
        items={sidebarItems.me}
        selectedProject={selectedProject}
      />
    </SidebarContent>
  );
};

export default SidebarAppPanel;
