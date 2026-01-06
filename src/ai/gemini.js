// ============================================
// MentorAI Gemini Integration
// Fast quiz generation using Google's Gemini Flash
// ============================================

/**
 * Generate content using Gemini API
 * Uses REST API directly to avoid extra dependencies
 */
export async function generateWithGemini(prompt, options = {}) {
  const {
    model = 'gemini-2.5-flash-preview-05-20', // Latest Gemini 2.5 Flash
    maxTokens = 4000,
    temperature = 0.7
  } = options;

  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY not found');
    return null;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          topP: 0.95,
          topK: 40
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      return null;
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    console.error('Gemini request failed:', error.message);
    return null;
  }
}

/**
 * Generate quiz using Gemini Flash for speed
 */
export async function generateQuizWithGemini(topic, numQuestions = 5, difficulty = 'medium') {
  const prompt = `You are a quiz generator. Create a ${difficulty.toUpperCase()} difficulty quiz about "${topic}" with exactly ${numQuestions} multiple choice questions.

REQUIREMENTS:
1. Questions should be educational and test real understanding
2. Include a mix of concept, code, and scenario questions
3. Make wrong options plausible (common mistakes)
4. Each question should teach something valuable

Return ONLY valid JSON in this exact format (no markdown, no code blocks, just JSON):
{
  "quizTitle": "Catchy title about ${topic}",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": 1,
      "question": "Clear question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why the correct answer is right and others are wrong.",
      "conceptTested": "Specific concept"
    }
  ],
  "encouragement": "Motivational message"
}`;

  const startTime = Date.now();
  const response = await generateWithGemini(prompt, {
    model: 'gemini-2.5-flash-preview-05-20',
    temperature: 0.8,
    maxTokens: 4000
  });
  
  const elapsed = Date.now() - startTime;
  console.log(`⚡ Gemini quiz generated in ${elapsed}ms`);

  if (!response) return null;

  try {
    // Try to parse JSON directly
    let parsed;
    try {
      parsed = JSON.parse(response);
    } catch {
      // Extract JSON from response if wrapped in markdown
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    }

    if (parsed && parsed.questions && parsed.questions.length > 0) {
      // Validate and normalize questions
      parsed.questions = parsed.questions.map((q, i) => ({
        id: q.id || i + 1,
        question: q.question || 'Question ' + (i + 1),
        options: Array.isArray(q.options) && q.options.length === 4
          ? q.options
          : ['Option A', 'Option B', 'Option C', 'Option D'],
        correctIndex: typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3
          ? q.correctIndex
          : 0,
        explanation: q.explanation || 'This is the correct answer.',
        conceptTested: q.conceptTested || topic,
        difficulty: difficulty
      }));

      return parsed;
    }
  } catch (error) {
    console.error('Failed to parse Gemini response:', error.message);
  }

  return null;
}

export default {
  generateWithGemini,
  generateQuizWithGemini
};
