"use client"; // Added "use client"

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Use TabsList and TabsTrigger for shadcn structure
import { Button } from "@/components/ui/button"; // Not needed for triggers if using TabsTrigger
import { cn } from "@/lib/utils";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism"; // Import both styles
import { useTheme } from "next-themes"; // To get current theme for syntax highlighter
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"; // For scrollable tabs

type Props = {
  filesReferences: { fileName: string; sourceCode: string; summary: string }[];
};

const CodeReferences = ({ filesReferences }: Props) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = React.useState(
    filesReferences[0]?.fileName ?? "",
  );

  // Update activeTab if filesReferences changes and current activeTab is no longer valid
  React.useEffect(() => {
    if (
      filesReferences.length > 0 &&
      !filesReferences.find((f) => f.fileName === activeTab)
    ) {
      setActiveTab(filesReferences[0]?.fileName ?? "");
    } else if (filesReferences.length === 0) {
      setActiveTab("");
    }
  }, [filesReferences, activeTab]);

  if (!filesReferences || filesReferences.length === 0) {
    return null; // Don't render if no references
  }

  return (
    <div className="w-full max-w-full">
      {" "}
      {/* Take full available width */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <ScrollArea className="w-full whitespace-nowrap rounded-md border-b bg-muted/30 dark:bg-muted/10">
          <TabsList className="flex h-auto w-max space-x-1 bg-transparent p-1">
            {" "}
            {/* Use TabsList, allow horizontal scroll */}
            {filesReferences.map((file) => (
              <TabsTrigger
                key={file.fileName}
                value={file.fileName}
                className={cn(
                  "whitespace-nowrap rounded-sm px-2.5 py-1 text-xs font-medium text-muted-foreground ring-offset-background transition-all hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm sm:text-sm",
                  // Removed your custom active styles to use shadcn's default active state for TabsTrigger
                )}
                title={file.fileName}
              >
                <span className="max-w-[100px] truncate sm:max-w-[150px]">
                  {file.fileName}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {filesReferences.map((file) => (
          <TabsContent
            key={file.fileName}
            value={file.fileName}
            // Max height for code block, width is handled by parent
            className="mt-2 max-h-[60vh] overflow-auto rounded-md border bg-background data-[state=inactive]:hidden"
          >
            {/* The div with style={{all: "initial"}} can sometimes interfere with parent styles */}
            {/* Consider removing it or being more specific if it causes issues */}
            {/* <div style={{ all: "initial" }}>  */}
            <SyntaxHighlighter
              style={theme === "dark" ? oneDark : oneLight} // Dynamic style based on theme
              language={file.fileName.split(".").pop() ?? "tsx"} // Infer language
              showLineNumbers
              wrapLines={true} // Enable line wrapping
              wrapLongLines={true} // Enable long line wrapping
              customStyle={{
                fontSize: "0.8rem", // Slightly smaller for dense code
                margin: 0, // Remove default margin from highlighter
                borderRadius: "0.375rem", // Match rounded-md
                maxHeight: "60vh", // Ensure syntax highlighter itself is scrollable if content exceeds
                overflow: "auto",
              }}
              lineNumberStyle={{ opacity: 0.5, fontSize: "0.7rem" }}
            >
              {file.sourceCode}
            </SyntaxHighlighter>
            {/* </div> */}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default CodeReferences;
