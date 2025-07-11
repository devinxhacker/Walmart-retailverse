const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const Product = require('../models/Product');
require('dotenv').config();

const router = express.Router();

// Initialize Gemini
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Attempts to generate content with Gemini, falling back to Groq on timeout or error.
 * @param {string} prompt The prompt to send to the model.
 * @param {boolean} isStreaming Whether to use the streaming API.
 * @returns {Promise<{result: any, source: 'gemini' | 'groq'}>}
 */
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

router.post('/query', async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Format the conversation history for the prompt
  const formattedHistory = (history || [])
    .map(msg => `${msg.from === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
    .join('\n');

  try {
    // Step 1: Convert natural language to a MongoDB query (non-streaming)
    const queryGenerationPrompt = `
      You are an expert MongoDB query generator. Your task is to convert a user's latest query into a valid MongoDB query object for a 'products' collection.
      Use the provided conversation history for context, especially for follow-up questions (e.g., "what about in red?").

      The product schema is as follows:
      ${getProductSchema()}

      CONVERSATION HISTORY:
      ${formattedHistory}

      Based on the user's NEWEST query below, generate a JSON object with three keys: 'query', 'sort', and 'limit'.
      - 'query': The MongoDB find() query object. Use regex for partial text matches on string fields.
      - 'sort': The MongoDB sort() object.
      - 'limit': The number of results to return. Default to 5 if not specified.

      NEWEST User Query: "${message}"

      Return ONLY the JSON object. Do not include any other text, explanations, or markdown formatting.
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
      dbQuery = JSON.parse(cleanedJsonString);
    } catch (e) {
      console.error('Error parsing model query response:', e, 'Raw response:', queryResponseText);
      return res.status(500).json({ message: "I had trouble understanding that. Could you please rephrase?" });
    }

    // Step 2: Execute the query against the database
    const products = await Product.find(dbQuery.query || {})
      .sort(dbQuery.sort || {})
      .limit(dbQuery.limit || 5);

    // Set headers for a streaming response
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Content-Type-Options': 'nosniff',
    });

    if (products.length === 0) {
      res.write("I couldn't find any products matching your request. Please try asking something else!");
      return res.end();
    }

    // Step 3: Generate a natural language response (streaming)
    const responseGenerationPrompt = `
      You are a friendly and helpful e-commerce chatbot assistant for a store called 'RetailVerse'. Your name is 'RetailBot'.
      Based on the following product data that was found in the database, provide a concise and conversational answer to the user's LATEST query.
      Do not just list the products. Summarize the findings in a helpful way.
      If the user asked for a specific number of items, mention that you found them.
      Keep your response friendly and brief.
      
      CONVERSATION HISTORY:
      ${formattedHistory}
      User: ${message}

      Product Data:
      ${JSON.stringify(products, null, 2)}
    `;

    const { result: streamResult, source: streamSource } = await generateContentWithFallback(responseGenerationPrompt, true);

    if (streamSource === 'gemini') {
      // Stream the response chunk by chunk from Gemini
      for await (const chunk of streamResult.stream) {
        const chunkText = chunk.text();
        res.write(chunkText);
      }
    } else { // source is 'groq'
      // Stream the response chunk by chunk from Groq
      for await (const chunk of streamResult) {
        res.write(chunk.choices[0]?.delta?.content || '');
      }
    }

    res.end();

  } catch (error) {
    console.error('Error in chatbot query:', error);
    if (!res.headersSent) res.status(500).json({ message: 'Sorry, something went wrong on my end. Please try again.' });
    else res.end();
  }
});

module.exports = router;