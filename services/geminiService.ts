import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION, JSON_EXTRACTION_PROMPT, JSON_HISTORY_EXTRACTION_PROMPT } from "../constants"; // New import
import { AnalysisResult, FrequencyData, MarketInput, HistoryRecord } from "../types"; // Updated import

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert file to Base64
const fileToPart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64Data = reader.result.split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type,
          },
        });
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const performMarketAnalysis = async (
  input: MarketInput,
  onLog: (msg: string, type?: 'info' | 'success' | 'error') => void
): Promise<AnalysisResult> => {

  const { 
    industry, 
    geography, 
    query, 
    researchQuestion, 
    assumptionTested, 
    rawSignals, 
    files, 
    useWebSearch, 
    isShortResearch 
  } = input;

  let combinedSignals = rawSignals;
  let webGroundingMetadata: { web?: { uri: string; title: string }[] } | undefined = undefined;

  // 1. Web Search Phase (if enabled)
  if (useWebSearch) {
    onLog("Initiating Google Search grounding...");
    try {
      // Use Gemini 3 Flash for fast, grounded search retrieval
      const limit = isShortResearch ? "5" : "15";
      const searchPrompt = `Find recent discussions, forums, news snippets, and reviews regarding "${query}" in the "${industry}" sector in "${geography}". Focus on problems, complaints, and inefficiencies. Summarize the top ${limit} most relevant negative signals found.`;
      
      const searchResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        // The `contents` field should be an object with a `parts` array for robust handling.
        contents: {
          parts: [{ text: searchPrompt }],
        },
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const searchContent = searchResponse.text;
      if (searchContent) {
        combinedSignals += `\n\n=== RETRIEVED WEB SIGNALS ===\n${searchContent}`;
        onLog("Web signals retrieved and added to context.");
      }

      // Extract grounding metadata to show sources later
      const chunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        webGroundingMetadata = {
          web: chunks
            .filter((c: any) => c.web?.uri)
            .map((c: any) => ({ uri: c.web.uri, title: c.web.title || "Source" })),
        };
      }
    } catch (error) {
      console.error("Search failed", error);
      onLog("Warning: Web search encountered an issue. Proceeding with provided data.", "error");
    }
  }

  // 2. Prepare content for Analysis
  const contents = [];
  
  // Add text signals with expanded context
  const contextPrompt = `
  INDUSTRY: ${industry}
  GEOGRAPHY: ${geography}
  PROBLEM FOCUS: ${query}
  ${researchQuestion ? `SPECIFIC RESEARCH QUESTION: ${researchQuestion}` : ''}
  ${assumptionTested ? `ASSUMPTION TO TEST: ${assumptionTested}` : ''}
  
  COLLECTED SIGNALS:
  ${combinedSignals || "No text signals provided."}
  
  Output Mode: ${isShortResearch ? 'SCAN' : 'DEEP'}
  `;
  
  contents.push({ text: contextPrompt });

  // Add file signals
  if (files.length > 0) {
    onLog(`Processing ${files.length} uploaded files...`);
    for (const file of files) {
      const part = await fileToPart(file);
      contents.push(part);
    }
  }

  // 3. Analysis Phase
  if (isShortResearch) {
    onLog("Running Quick Scan Analysis (Gemini 3 Flash)...");
  } else {
    onLog("Engaging Gemini 3 Pro with Deep Thinking...");
  }
  
  const modelName = isShortResearch ? 'gemini-3-flash-preview' : 'gemini-3-pro-preview';
  const thinkingConfig = isShortResearch 
    ? { thinkingBudget: 0 } 
    : { thinkingBudget: 32768 };

  const analysisResponse = await ai.models.generateContent({
    model: modelName,
    contents: {
      role: 'user',
      parts: contents.map(c => ('text' in c ? { text: c.text } : c))
    },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: thinkingConfig,
    },
  });

  const fullReport = analysisResponse.text || "Analysis failed to generate output.";
  onLog(isShortResearch ? "Quick scan complete." : "Deep analysis complete.");

  // 4. Data Extraction Phase (Fast Follow-up)
  onLog("Extracting structured data for visualization...");

  let chartData: FrequencyData[] = [];
  try {
    const extractionResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      // Fix: Wrap the prompt string in a parts array for clarity and to align with common usage patterns
      contents: {
        parts: [{
          text: `
            Analyze the following market research report and extract the top problems for a chart.
            ${JSON_EXTRACTION_PROMPT}
            
            REPORT CONTENT:
            ${fullReport.substring(0, 15000)} 
          `,
        }],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    problem: { type: Type.STRING, description: 'Max 5 words' },
                    frequency: { type: Type.NUMBER, description: '1 for LOW, 5 for MEDIUM, 10 for HIGH' },
                    segment: { type: Type.STRING, description: 'Max 3 words' }
                },
                required: ["problem", "frequency", "segment"]
            }
        },
        maxOutputTokens: 1024 // Increased maxOutputTokens to prevent truncation of JSON
      }
    });

    let jsonStr = extractionResponse.text || '';
    if (jsonStr) {
      // 1. Try to extract JSON from a markdown code block (e.g., ```json ... ```)
      const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonStr = jsonMatch[1];
      }
      
      jsonStr = jsonStr.trim(); // Trim any leading/trailing whitespace

      // 2. Aggressively find the first '[' and last ']' to isolate the array
      let effectiveJsonString = '';
      const firstBracket = jsonStr.indexOf('[');
      const lastBracket = jsonStr.lastIndexOf(']');

      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        effectiveJsonString = jsonStr.substring(firstBracket, lastBracket + 1);
      } else {
        // Fallback: If no array structure is found, check for a single JSON object.
        // The schema explicitly asks for an array, but models can sometimes deviate.
        const firstCurly = jsonStr.indexOf('{');
        const lastCurly = jsonStr.lastIndexOf('}');
        
        if (firstCurly !== -1 && lastCurly !== -1 && lastCurly > firstCurly) {
          // Attempt to wrap a single object in an array
          effectiveJsonString = `[${jsonStr.substring(firstCurly, lastCurly + 1)}]`;
          onLog("Warning: Model returned a single JSON object; attempting to wrap it in an array for parsing.", "info");
        } else {
          // If neither array nor object structure is found, it's genuinely malformed or empty.
          throw new Error("Extracted text does not contain a valid JSON array or object structure. Raw output: " + jsonStr);
        }
      }
      
      chartData = JSON.parse(effectiveJsonString);
    }
  } catch (e) {
    console.error("JSON Extraction failed", e);
    onLog(`Warning: Could not generate chart data. Error: ${(e as Error).message}`, "error");
  }

  return {
    report: fullReport,
    groundingMetadata: webGroundingMetadata,
    chartData
  };
};

// New function to extract structured history data
// Fix: Add 'decision' to the Omit list as it's derived in App.tsx and not directly returned by the model.
export const extractHistoryRecordData = async (
  fullReport: string,
  onLog: (msg: string, type?: 'info' | 'success' | 'error') => void
): Promise<Omit<HistoryRecord, 'researchId' | 'date' | 'industry' | 'geography' | 'problemFocus' | 'assumptionTested' | 'tags' | 'researchStage' | 'fullReportSnippet' | 'decision'>> => {
  onLog("Extracting history metadata...");
  try {
    const extractionResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [{
          text: `
            Analyze the following market research report and extract key history record fields.
            ${JSON_HISTORY_EXTRACTION_PROMPT}

            REPORT CONTENT:
            ${fullReport.substring(0, 15000)}
          `,
        }],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            opportunityStatus: { type: Type.STRING },
            overallConfidence: { type: Type.STRING },
            keyProblems: { type: Type.ARRAY, items: { type: Type.STRING } },
            primaryRisk: { type: Type.STRING },
            recommendedNextStep: { type: Type.STRING },
            stopRuleOutcome: { type: Type.STRING },
          },
          required: ["opportunityStatus", "overallConfidence", "keyProblems", "primaryRisk", "recommendedNextStep", "stopRuleOutcome"]
        },
        maxOutputTokens: 1024, // Increased maxOutputTokens to prevent truncation
      },
    });

    let jsonStr = extractionResponse.text || '';
    if (jsonStr) {
      const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonStr = jsonMatch[1];
      }
      jsonStr = jsonStr.trim();
      
      // Attempt to parse and return
      const parsedData = JSON.parse(jsonStr);

      // Validate parsed data against expected structure
      const requiredFields = [
        "opportunityStatus", "overallConfidence", "keyProblems", 
        "primaryRisk", "recommendedNextStep", "stopRuleOutcome"
      ];
      for (const field of requiredFields) {
        if (parsedData[field] === undefined) {
          throw new Error(`Missing field in extracted history record: ${field}`);
        }
      }

      return parsedData;

    } else {
      throw new Error("No JSON output from history extraction model.");
    }
  } catch (e) {
    console.error("History data extraction failed", e);
    onLog(`Warning: Could not extract history data. Error: ${(e as Error).message}`, "error");
    // Return a default/empty structure to avoid crashing the app
    return {
      opportunityStatus: 'PAUSE',
      overallConfidence: 'LOW',
      keyProblems: ['Extraction failed'],
      primaryRisk: 'Unknown',
      recommendedNextStep: 'Review report manually',
      stopRuleOutcome: 'CONTINUE RESEARCH',
    };
  }
};