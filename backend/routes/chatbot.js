const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const Product = require('../models/Product');
const { set } = require('mongoose');
require('dotenv').config();

const router = express.Router();

// Initialize Gemini
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY, baseUrl: 'https://api.groq.io/v1', dangerouslyAllowBrowser: true });



const getProductSchema = () => {
  // Dynamically get a simplified schema representation
  const schema = Product.schema.obj;
  const schemaString = JSON.stringify(schema, (key, value) => {
    if (typeof value === 'function' || (typeof value === 'object' && value.type)) {
      return value.type ? value.type.name : 'Object';
    }
    return value;
  }, 2);
  return schemaString;
};


const generateContentWithFallback = async (prompt, isStreaming = false) => {
  const TIMEOUT_MS = 8000; // 8-second timeout for Gemini

  const geminiPromise = isStreaming
    ? geminiModel.generateContentStream(prompt)
    : geminiModel.generateContent(prompt);

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Gemini timeout')), TIMEOUT_MS)
  );

  try {
    console.log("Attempting to generate content with Gemini...");
    const result = await Promise.race([geminiPromise, timeoutPromise]);
    console.log("Gemini succeeded.");
    return { result, source: 'gemini' };
  } catch (error) {
    console.warn(`Gemini failed or timed out: ${error.message}. Switching to Groq.`);
    const groqChatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192', // Fast and capable model
      stream: isStreaming,
    });
    return { result: groqChatCompletion, source: 'groq' };
  }
};


router.post('/query', async (req, res) => {
  const { message, history, targetIds } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  console.log("History:", history);
  console.log("Target Ids:", targetIds);


  try {
    // Step 1: Convert natural language to a MongoDB query (non-streaming)
    const queryGenerationPrompt = `
      You are an expert MongoDB query generator. Your task is to convert a user's LATEST query into a valid MongoDB query object for a 'products' collection.
      Use the provided conversation history for context, especially for follow-up questions (e.g., "what about in red?").

      Conversation History:
      ${history}

      Previous response Targeted Id/Ids:
      ${targetIds}
      remain to this target id/ids unless user Newest query move to anyother product topic.

      The product schema is as follows:
      ${getProductSchema()}

      Based on the user's NEWEST query below, generate a JSON object with three keys: 'query', 'sort', and 'limit'.
      - 'query': The MongoDB find() query object. Use regex for partial text matches on string fields.
      - 'sort': The MongoDB sort() object.
      - 'limit': The number of results to return. Default to 5 if not specified.

      NEWEST User Query: "${message}"

      Return ONLY the raw JSON object. Do not include any other text, explanations, or markdown formatting.
    `;

    const { result: queryGenerationResult, source: querySource } = await generateContentWithFallback(queryGenerationPrompt, false);

    let queryResponseText;
    if (querySource === 'gemini') {
      queryResponseText = await queryGenerationResult.response.text();
    } else { // source is 'groq'
      queryResponseText = queryGenerationResult.choices[0]?.message?.content || '';
    }

    let dbQuery;
    try {
      // The response might be wrapped in markdown, so we clean it.
      const cleanedJsonString = queryResponseText.replace(/```json\n|\n```/g, '').trim();
      let parsedQuery = JSON.parse(cleanedJsonString);

      // Recursively transform any {$oid: "..."} objects into plain strings
      // This prevents Mongoose CastError when the AI returns an ObjectId in extended JSON format.
      const transformOid = (obj) => {
        if (obj === null || typeof obj !== 'object') {
          return obj;
        }
        if (Array.isArray(obj)) {
          return obj.map(transformOid);
        }
        if (obj['$oid'] && Object.keys(obj).length === 1) {
          return obj['$oid'];
        }
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            obj[key] = transformOid(obj[key]);
          }
        }
        return obj;
      };
      dbQuery = transformOid(parsedQuery);
    } catch (e) {
      console.error('Error parsing model query response:', e, 'Raw response:', queryResponseText);
      return res.status(500).json({ message: "I had trouble understanding that. Could you please rephrase?" });
    }

    // Step 2: Execute the query against the database
    const products = await Product.find(dbQuery.query || {})
      .sort(dbQuery.sort || {})
      .limit(dbQuery.limit || 5);
  
    res.json(products);

  } catch (error) {
    console.error('Error in chatbot query:', error);
    res.status(500).json({ message: 'Internal server error' });
    
  }
});

module.exports = router;