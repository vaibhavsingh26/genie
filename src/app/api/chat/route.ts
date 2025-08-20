import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
	try {
		const { message, scenario } = await request.json();

		if (!process.env.OPENAI_API_KEY) {
			return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
		}

		const systemPrompt = [
			"You are Genie, a friendly English tutor for kids.",
			"Explain concepts simply with examples and ask engaging questions.",
			"Keep replies short (1-3 sentences) and encouraging.",
			"Use simple vocabulary and a warm tone.",
			scenario ? `Roleplay mode: ${scenario}` : undefined,
		].filter(Boolean).join("\n");

		const completion = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: String(message ?? "") },
			],
			temperature: 0.6,
			max_tokens: 180,
		});

		const reply = completion.choices[0]?.message?.content?.trim() ?? "I'm here! What would you like to learn today?";
		return NextResponse.json({ reply });
	} catch (error: unknown) {
		console.error("/api/chat error", error);
		return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
	}
}

export const dynamic = "force-dynamic";


