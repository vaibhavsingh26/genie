import { NextResponse } from "next/server";
import OpenAI from "openai";
import { toFile } from "openai/uploads";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
	try {
		if (!process.env.OPENAI_API_KEY) {
			return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
		}

		const formData = await request.formData();
		const audio = formData.get("audio");
		if (!audio || !(audio instanceof Blob)) {
			return NextResponse.json({ error: "No audio uploaded" }, { status: 400 });
		}

		const arrayBuffer = await (audio as Blob).arrayBuffer();
		const blob = new Blob([arrayBuffer], { type: (audio as Blob).type || "audio/webm" });
		const file = await toFile(blob, "audio.webm");

		// Prefer the newer transcribe model; fallback to whisper if needed
		let text: string | undefined;
		try {
			const transcription = await openai.audio.transcriptions.create({
				model: "gpt-4o-mini-transcribe",
				file,
			});
			// @ts-expect-error - SDK types may differ; .text exists on response
			text = transcription.text?.toString();
		} catch (err) {
			const transcription = await openai.audio.transcriptions.create({
				model: "whisper-1",
				file,
			});
			// @ts-expect-error - SDK types may differ; .text exists on response
			text = transcription.text?.toString();
		}

		return NextResponse.json({ text: text ?? "" });
	} catch (error: unknown) {
		console.error("/api/stt error", error);
		return NextResponse.json({ error: "Failed to transcribe audio" }, { status: 500 });
	}
}

export const dynamic = "force-dynamic";


