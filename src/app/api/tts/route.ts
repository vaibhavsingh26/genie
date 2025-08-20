import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const { text } = await request.json();
		if (!text || typeof text !== "string") {
			return NextResponse.json({ error: "Missing text" }, { status: 400 });
		}

		const apiKey = process.env.ELEVENLABS_API_KEY;
		const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

		if (!apiKey) {
			return NextResponse.json({ error: "TTS not configured" }, { status: 501 });
		}

		const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?optimize_streaming_latency=0&output_format=mp3_44100_128`;
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"accept": "audio/mpeg",
				"content-type": "application/json",
				"xi-api-key": apiKey,
			},
			body: JSON.stringify({
				text,
				model_id: "eleven_multilingual_v2",
				voice_settings: { stability: 0.4, similarity_boost: 0.8 },
			}),
		});

		if (!response.ok) {
			const errText = await response.text();
			return NextResponse.json({ error: "TTS request failed", details: errText }, { status: 500 });
		}

		const arrayBuffer = await response.arrayBuffer();
		return new Response(Buffer.from(arrayBuffer), {
			headers: { "Content-Type": "audio/mpeg" },
		});
	} catch (error: unknown) {
		console.error("/api/tts error", error);
		return NextResponse.json({ error: "Failed to synthesize speech" }, { status: 500 });
	}
}

export const dynamic = "force-dynamic";


