import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { type Document } from "@langchain/core/documents";
import { generateEmbedding, summarizeCode } from "./gemini";
import { db } from "@/server/db";

export const loadRepo = async (githubUrl: string, githubToken?: string) => {
  const loader = new GithubRepoLoader(githubUrl, {
    accessToken: githubToken,
    branch: "main",
    ignoreFiles: [
      "package-lock.json",
      "yarn.lock",
      "pnpm-Lock.yaml",
      "bun.lockb",
      "LICENSE",
    ],
    recursive: true,
    unknown: "warn",
    maxConcurrency: 5,
  });
  const docs = await loader.load();
  return docs;
};

type EmbeddingResult = {
  summary: string;
  embedding: number[];
  sourceCode: string;
  fileName: string;
};

type ProgressCallback = (step: string, progress: number) => void;
export const indexGithubRepo = async (
  projectId: string,
  githubUrl: string,
  githubToken?: string,
  progressCallback?: ProgressCallback,
) => {
  if (progressCallback) progressCallback("Loading repo", 0.05);
  const docs = await loadRepo(githubUrl, githubToken);

  if (progressCallback) progressCallback("Generating embeddings", 0.1);
  const allEmbeddings: EmbeddingResult[] = await generateEmbeddings(
    docs,
    progressCallback,
  );

  let i = 0;
  const total = allEmbeddings.length;
  await Promise.allSettled(
    allEmbeddings.map(
      async (embedding: EmbeddingResult, index): Promise<void> => {
        if (!embedding) return;
        const { summary, embedding: emb, sourceCode, fileName } = embedding;
        const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
          data: { projectId, summary, sourceCode, fileName },
        });
        await db.$executeRaw`
          UPDATE "SourceCodeEmbedding"
          SET "summaryEmbedding" = ${emb}::vector
          WHERE "id" = ${sourceCodeEmbedding.id}
        `;
        i++;
        if (progressCallback)
          progressCallback(`Indexing ${fileName}`, 0.1 + (i / total) * 0.4); // up to 50%
      },
    ),
  );
};

const generateEmbeddings = async (
  docs: Document[],
  progressCallback?: ProgressCallback,
): Promise<EmbeddingResult[]> => {
  const results: EmbeddingResult[] = [];

  let index = 0;
  for (const doc of docs) {
    const summary = await summarizeCode(doc);
    const embedding = await generateEmbedding(summary);

    results.push({
      summary,
      embedding,
      sourceCode: JSON.parse(JSON.stringify(doc.pageContent)) as string,
      fileName: doc.metadata.source as string,
    });

    index++;
    if (progressCallback)
      progressCallback(
        `Embedding ${doc.metadata.source}`,
        (index / docs.length) * 0.3,
      ); // up to 30%

    if (index % 10 === 0) {
      if (progressCallback) progressCallback("Pausing for rate limit", 0.3);
      await new Promise((resolve) => setTimeout(resolve, 60_000));
    }
  }

  return results;
};
