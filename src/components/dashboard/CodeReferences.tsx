import React from "react";
import { Tabs, TabsContent } from "../ui/tabs";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

type Props = {
  filesReferences: { fileName: string; sourceCode: string; summary: string }[];
};

const CodeReferences = ({ filesReferences }: Props) => {
  const [tab, setTab] = React.useState(filesReferences[0]?.fileName);
  return (
    <div className="w-full max-w-[75vw]">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex gap-2 overflow-x-scroll rounded-md bg-transparent p-1">
          {filesReferences.map((file) => (
            <Button
              key={file.fileName}
              value={file.fileName}
              onClick={() => setTab(file.fileName)}
              className={cn(
                "whitespace-nowrap rounded-md bg-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 text-muted-foreground transition-colors hover:bg-muted",
                {
                  "bg-brand-blue-400 text-primary-foreground hover:bg-brand-blue-300":
                    tab === file.fileName,
                },
              )}
            >
              {file.fileName}
            </Button>
          ))}
        </div>
        {filesReferences.map((file) => (
          <TabsContent
            key={file.fileName}
            value={file.fileName}
            className="max-h-[70vh] max-w-[75vw] overflow-auto rounded-md"
          >
            <div style={{ all: "initial" }}>
              <SyntaxHighlighter
                style={oneDark}
                language="tsx"
                showLineNumbers
                wrapLines
                wrapLongLines
                customStyle={{ fontSize: "0.9rem" }}
              >
                {file.sourceCode}
              </SyntaxHighlighter>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default CodeReferences;
