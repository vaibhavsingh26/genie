"use client";
import { useEffect, useRef, useState } from "react";

type Scenario = "" | "At School" | "At Store" | "At Home";

export default function Home() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [assistant, setAssistant] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [scenario, setScenario] = useState<Scenario>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      await handleSubmitAudio(blob);
      stream.getTracks().forEach((t) => t.stop());
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  async function handleSubmitAudio(blob: Blob) {
    try {
      setLoading(true);
      setAssistant("");
      const form = new FormData();
      form.append("audio", blob, "audio.webm");
      const sttRes = await fetch("/api/stt", { method: "POST", body: form });
      const sttJson = await sttRes.json();
      const userText = String(sttJson.text || "");
      setTranscript((prev) => (prev ? prev + "\n" : "") + (userText || "[no speech detected]"));

      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, scenario }),
      });
      const chatJson = await chatRes.json();
      const reply = String(chatJson.reply || "");
      setAssistant((prev) => (prev ? prev + "\n" : "") + reply);

      const ttsRes = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: reply }),
      });
      if (ttsRes.ok) {
        const buf = await ttsRes.arrayBuffer();
        const url = URL.createObjectURL(new Blob([buf], { type: "audio/mpeg" }));
        setAudioUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        const audio = new Audio(url);
        audio.play().catch(() => {});
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Genie: Kids English Tutor</h1>

      <div className="flex flex-col gap-2 items-center">
        <label className="text-sm text-gray-600">Roleplay Mode</label>
        <select
          className="border rounded px-3 py-2"
          value={scenario}
          onChange={(e) => setScenario(e.target.value as Scenario)}
        >
          <option value="">Off</option>
          <option value="At School">At School</option>
          <option value="At Store">At Store</option>
          <option value="At Home">At Home</option>
        </select>
      </div>

      <div className="flex items-center gap-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="bg-blue-600 text-white rounded-full px-6 py-3 disabled:opacity-50"
            disabled={loading}
          >
            🎤 Start
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="bg-red-600 text-white rounded-full px-6 py-3"
          >
            ⏹ Stop
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
        <div className="border rounded p-4">
          <h2 className="font-medium mb-2">You said</h2>
          <pre className="whitespace-pre-wrap text-sm text-gray-800">{transcript || ""}</pre>
        </div>
        <div className="border rounded p-4">
          <h2 className="font-medium mb-2">Genie replied</h2>
          <pre className="whitespace-pre-wrap text-sm text-gray-800">{assistant || ""}</pre>
        </div>
      </div>

      {audioUrl && (
        <audio className="mt-2" src={audioUrl} controls />
      )}

      {loading && <div className="text-sm text-gray-600">Processing…</div>}
    </div>
  );
}
