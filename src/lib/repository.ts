import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github"
import { type Document } from "@langchain/core/documents"
import { generateEmbedding, summarizeCode } from "./gemini"
import { db } from "@/server/db"

export const loadRepo = async (githubUrl: string, githubToken?: string) => {
    const loader = new GithubRepoLoader(githubUrl, {
        accessToken: githubToken ?? '',
        branch: 'main',
        ignoreFiles: ['package-lock.json', 'yarn.lock', 'pnpm-Lock.yaml', 'bun.lockb', 'LICENSE'],
        recursive: true,
        unknown: 'warn',
        maxConcurrency: 5
    })
    const docs = await loader.load()
    return docs
}

type EmbeddingResult = {
    summary: string;
    embedding: number[];
    sourceCode: string;
    fileName: string;
};

export const indexGithubRepo = async (projectId: string, githubUrl: string, githubToken?: string) => {
    const docs = await loadRepo(githubUrl, githubToken);
    const allEmbeddings: EmbeddingResult[] = await generateEmbeddings
        (docs)
    await Promise.allSettled(allEmbeddings.map(async (embedding: EmbeddingResult, index): Promise<void> => {
        console.log(`Indexing ${index + 1} of ${allEmbeddings.length}`)
        if (!embedding) return
        const { summary, embedding: emb, sourceCode, fileName } = embedding
        const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
            data: {
                projectId,
                summary,
                sourceCode,
                fileName
            }
        });
        await db.$executeRaw`
    UPDATE "SourceCodeEmbedding"
    SET "summaryEmbedding" = ${emb}::vector
    WHERE "id" = ${sourceCodeEmbedding.id}
    `
    }))
}

const generateEmbeddings = async (docs: Document[]): Promise<EmbeddingResult[]> => {
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
        if (index % 10 === 0) {
            console.log("⏳ Waiting 1 minute to respect rate limits...");
            await new Promise((resolve) => setTimeout(resolve, 60_000));
        }
    }

    return results;
};
