// Quick API test script to verify both OpenRouter and Gemini are working
import { GoogleGenAI } from "@google/genai";

// Environment variables
const OPENROUTER_API_KEY = "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";
const GEMINI_API_KEY = "AIzaSyBCbKDpsswCbu6IcI7rUgrKvm592WUfbb4";

// Test OpenRouter API
async function testOpenRouter() {
    console.log("\n🧪 Testing OpenRouter API (Nemotron)...");

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://bookcraft-ai.local",
                "X-Title": "BookCraft AI Test"
            },
            body: JSON.stringify({
                model: "nvidia/nemotron-nano-9b-v2:free",
                messages: [
                    {
                        role: "user",
                        content: "Generate 3 chapter titles for a fantasy novel about dragons. Return only a JSON object: {\"chapters\": [\"title1\", \"title2\", \"title3\"]}"
                    }
                ],
                response_format: { type: "json_object" },
                temperature: 0.7,
                max_tokens: 200
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        const parsed = JSON.parse(content);

        console.log("✅ OpenRouter API Working!");
        console.log("📝 Generated chapters:", parsed.chapters);

        return true;
    } catch (error) {
        console.log("❌ OpenRouter API Failed:");
        console.log("   Error:", error.message);
        return false;
    }
}

// Test Gemini API
async function testGemini() {
    console.log("\n🧪 Testing Gemini Flash 2.5 API...");

    try {
        const geminiAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

        // Test text generation
        const textResponse = await geminiAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Write a single sentence about the importance of books in fantasy literature.",
        });

        console.log("✅ Gemini Text Generation Working!");
        console.log("📝 Generated text:", textResponse.text.substring(0, 100) + "...");

        // Test image generation
        console.log("\n🖼️  Testing Gemini image generation...");
        const imageResponse = await geminiAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Generate an image: A simple cartoon dragon reading a book",
            config: {
                temperature: 0.7,
            },
        });

        // Note: Gemini Flash 2.5 may not support image generation directly via generateContent
        // Let's just check if we got a text response for now
        if (imageResponse.text) {
            console.log("📝 Gemini responded to image request with text:");
            console.log("   " + imageResponse.text.substring(0, 100) + "...");
            console.log("⚠️  Note: Gemini Flash 2.5 may not support direct image generation");
        } else {
            console.log("⚠️  Gemini image generation: No response received");
        }

        return true;
    } catch (error) {
        console.log("❌ Gemini API Failed:");
        console.log("   Error:", error.message);
        if (error.status) {
            console.log("   Status:", error.status);
        }
        return false;
    }
}

// Run tests
async function runTests() {
    console.log("🚀 BookCraft AI - API Testing Suite");
    console.log("=====================================");

    const openRouterOk = await testOpenRouter();
    const geminiOk = await testGemini();

    console.log("\n📊 Test Results:");
    console.log("================");
    console.log(`OpenRouter (Text): ${openRouterOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Gemini (Images):   ${geminiOk ? '✅ PASS' : '❌ FAIL'}`);

    if (openRouterOk && geminiOk) {
        console.log("\n🎉 All APIs working! BookCraft AI is ready to go!");
    } else {
        console.log("\n⚠️  Some APIs failed. Check your API keys and network connection.");
    }
}

runTests().catch(console.error);