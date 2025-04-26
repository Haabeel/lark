import { GoogleGenerativeAI } from "@google/generative-ai";
import { type Document } from "@langchain/core/documents";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-lite",
});

export const geminiSummarizeCommit = async (diff: string) => {
  const response = await model.generateContent([
    `You are an expert programmer, and you are trying to summarize a git diff.
Reminders about the git diff format:
For every file, there are a few metadata lines, like (for example):
\`\`\`
diff --git a/lib/index.js b/lib/index.js
index aadf691..bjef603 100644
--- a/lib/index.js
+++ b/lib/index.js
\`\`\`
This means that \`lib/index.js\` was modified in this commit. Note that this is only an example.
Then there is a specifier if the lines that were modified.
A line starting with \`+\` means it was added.
A line that starts with \`-\` means it was removed.
A line that starts with neither is code given for context and better understanding.
It is not part of the diff.
[...]
EXAMPLE SUMMARY COMMENTS:
\`\`\`
* Raised the amount of returned recordings from \`10\ to \`100\ [packages/server/recordings_api.ts], [packages/server/constants.ts]
* Fixed a type in the github action name [.github/workflows/gpt-commit-summarizer.yml]
* Moved the \`octokit\` initialization to a separate file [src/octokit.ts], [src/index.ts]
* Added on OpenAI API for completions [packages/utils/apis/openai.ts]
* Lowered numeric tolerance for test files
\`\`\`
Most commits will have less comments than this example list.
The last comment does not include the file names,
because there were more than two relevant files in the hypothetical commit.
Do not include parts of the example in your summary.
It is given only as an example of appropriate comments.`,
    `Please summarize the following diff file: \n\n${diff}`,
  ]);
  return response.response.text();
};

export async function summarizeCode(document: Document): Promise<string> {
  console.log("getting summary for: ", document.metadata.source);
  const code = document.pageContent.slice(0, 10000)
  const response = await model.generateContent([
    `As a Senior Software Engineer, provide a concise, comprehensive summary of the given code. Your summary must be detailed, technically thorough, and demonstrate deep understanding, while maintaining clarity and brevity. Focus solely on the code’s structure, functionality, and logic—highlight key components, design patterns, algorithms, and implementation details. Avoid extraneous commentary, speculation, or non-code-related context. Rely strictly on the provided code, and present the summary in clear paragraph form for technical readers. The Summary should not be longer than 100 words.
  Here is the code:
  ---
  ${code}
  ---
  `
  ]);
  return response.response.text();
}



export async function generateEmbedding(summary: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({
    model: "text-embedding-004"
  })
  const result = await model.embedContent(summary)
  const embedding = result.embedding
  return embedding.values
}

const AIPROMPT = [`You are an AI code assistant who answers questions about the codebase. Your target audience is a technical intern who is looking to understand the codebase.`, `AI assistant is a brand new, powerful, himan-like artificial intelligence. The traints of AI include expert knowledge, helpfulness, cleverness, and articulateness`, `AI is a well-behaved and well-mannered individual. AI is always friendly, kind and inspiring, and he is eager to provide vivid and thoughtful responses to the user. AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation. If the question is asking about code or a specific file, AI will provide the detailed answer, giving step by step instructions, including cope snippets.`]