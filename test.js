import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAI } from "openai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const indexName = "job-resumes-debug";

// Initialize Pinecone index
const index = pinecone.index(indexName);

// Function to extract and chunk resume text
const extractResumeText = async () => {
  const resumePath = path.join(process.cwd(), "public", "resume.pdf");

  if (!fs.existsSync(resumePath)) {
    console.error("Error: Resume file not found at", resumePath);
    return "Resume file not found.";
  }

  try {
    const dataBuffer = fs.readFileSync(resumePath);
    const dataUint8Array = new Uint8Array(dataBuffer);
    const loadingTask = pdfjsLib.getDocument(dataUint8Array);
    const pdfDocument = await loadingTask.promise;
    let textContent = "";

    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContentObj = await page.getTextContent();
      textContent += textContentObj.items.map((item) => item.str).join(" ");
    }

    console.log("Extracted Resume Text:\n", textContent);
    return textContent;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    return "Failed to parse resume.";
  }
};

// Function to chunk resume into smaller pieces (e.g., sentences)
const chunkText = (text) => {
  const sentences = text.split(". ");  // Split based on period and space
  return sentences.map((sentence, index) => ({
    id: `chunk-${index}`,
    text: sentence.trim(),
  }));
};

// Function to store resume chunks in Pinecone
const storeResumeInVectorDB = async () => {
  const resumeText = await extractResumeText();
  const chunks = chunkText(resumeText);

  for (const chunk of chunks) {
    const embedding = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: chunk.text,
    });

    await index.upsert([
      {
        id: chunk.id,
        values: embedding.data[0].embedding,
        metadata: { text: chunk.text },
      },
    ]);
    console.log(`Stored chunk: ${chunk.id}`);
  }

  console.log("All resume chunks stored in vector database.");
};

// Function to query Pinecone with a specific question
const queryVectorStore = async (queryText) => {
  try {
    const queryEmbedding = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: queryText,
    });

    const queryVector = queryEmbedding.data[0].embedding;

    console.log("Query embedding (vector):", queryVector);  // Log query embedding

    const results = await index.query({
      vector: queryVector,
      topK: 3,  // Retrieve top 3 most relevant chunks
      includeMetadata: true,
    });

    console.log("Query results:", results);

    if (results.matches.length > 0) {
      const context = results.matches.map((match) => match.metadata.text).join("\n");
      console.log("Context from vector store:", context);
      return context;
    } else {
      console.log("No context found in vector store.");
      return "No context found.";
    }
  } catch (error) {
    console.error("Error querying vector store:", error);
    return "Error querying vector store.";
  }
};

// Run the functions
const run = async () => {
 // Store resume chunks first
  
  const queryText = "What AI projects are mentioned?";  // Example query based on resume content
  const context = await queryVectorStore(queryText);
  console.log("Final context from vector store:", context);
};

run();
