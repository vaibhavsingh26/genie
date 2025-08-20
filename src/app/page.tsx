"use client";
import { useEffect, useRef, useState } from "react";

type Scenario = "" | "At School" | "At Store" | "At Home";
type Language = "English" | "Hindi" | "Marathi" | "Gujarati" | "Tamil" | "Spanish";

// Extended types for browser APIs
type ExtendedNavigator = Navigator & {
  mediaDevices?: MediaDevices;
};

type ExtendedMediaDevices = MediaDevices & {
  getUserMedia?: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
  enumerateDevices?: () => Promise<MediaDeviceInfo[]>;
};

type ExtendedWindow = Window & {
  MediaRecorder: typeof MediaRecorder;
};

type ExtendedMediaRecorder = MediaRecorder & {
  mimeType?: string;
};

export default function Home() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [assistant, setAssistant] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [scenario, setScenario] = useState<Scenario>("");
  const [language, setLanguage] = useState<Language>("English");
  const [loading, setLoading] = useState(false);
  const [supportsRecording, setSupportsRecording] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  useEffect(() => {
    // Feature detection for MediaRecorder and getUserMedia
    try {
      const hasWindow = typeof window !== "undefined";
      const hasNavigator = typeof navigator !== "undefined";
      const hasMediaRecorder = hasWindow && "MediaRecorder" in window;
      const hasGetUserMedia = hasNavigator && !!(navigator as ExtendedNavigator).mediaDevices?.getUserMedia;
      setSupportsRecording(Boolean(hasMediaRecorder && hasGetUserMedia));
    } catch {
      setSupportsRecording(false);
    }

    // Try to list microphones (labels appear after permission is granted)
    (async () => {
      try {
        const enumerate = (navigator as ExtendedNavigator).mediaDevices?.enumerateDevices;
        if (enumerate) {
          const devices: MediaDeviceInfo[] = await enumerate();
          setInputDevices(devices.filter((d) => d.kind === "audioinput"));
        }
      } catch { /* ignore */ }
    })();
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  async function startRecording() {
    setError("");
    if (!supportsRecording) {
      setError("Recording not supported in this browser. Try the latest Chrome/Edge on HTTPS or localhost.");
      return;
    }
    try {
      const mediaDevices = (navigator as ExtendedNavigator).mediaDevices as ExtendedMediaDevices;
      const getUserMedia = mediaDevices?.getUserMedia;
      if (!getUserMedia) {
        setError("Microphone access API not available.");
        return;
      }
      const audioConstraints: MediaTrackConstraints = selectedDeviceId
        ? { deviceId: { exact: selectedDeviceId }, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        : { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
      const stream = await getUserMedia({ audio: audioConstraints });
      const MediaRecorderClass = (window as ExtendedWindow).MediaRecorder;
      const pickMimeType = (): string | undefined => {
        const candidates = [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/ogg;codecs=opus",
          "audio/mp4",
        ];
        if (typeof MediaRecorderClass?.isTypeSupported === "function") {
          for (const c of candidates) {
            try { if (MediaRecorderClass.isTypeSupported(c)) return c; } catch { /* no-op */ }
          }
        }
        return undefined;
      };
      const mimeType = pickMimeType();
      const recorder: MediaRecorder = mimeType ? new MediaRecorderClass(stream, { mimeType }) : new MediaRecorderClass(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const type = (recorder as ExtendedMediaRecorder)?.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });

        // If the recorded blob is too small, it's likely silence or no capture
        if (blob.size < 1024 * 5) { // 5KB threshold
          setError("No speech captured. Please speak, then press Stop. If it persists, pick a different microphone above.");
          stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
          setIsRecording(false);
          return;
        }
        await handleSubmitAudio(blob);
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err: unknown) {
      const error = err as Error;
      const name = error?.name || "Error";
      if (name === "NotAllowedError") setError("Microphone permission denied. Please allow access and try again.");
      else if (name === "NotFoundError") setError("No microphone found. Connect one and try again.");
      else if (name === "SecurityError") setError("Microphone access requires HTTPS or localhost.");
      else setError("Failed to start recording. " + (error?.message || ""));
    }
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
        body: JSON.stringify({ message: userText, scenario, language }),
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
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex flex-col items-center gap-6 p-6">
      {/* Header with fun design */}
      <div className="text-center bg-white rounded-3xl shadow-lg p-6 border-4 border-yellow-300">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
          🧞‍♂️ Genie: Your Magic English Tutor! 🎓
        </h1>
        <p className="text-lg text-gray-600 mt-2">✨ Learn English with fun conversations! ✨</p>
      </div>

      {/* Settings Panel */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-300 max-w-2xl w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Roleplay Mode */}
          <div className="flex flex-col gap-2">
            <label className="text-lg font-semibold text-purple-700 flex items-center gap-2">
              🎭 Roleplay Mode
            </label>
            <select
              className="border-2 border-purple-300 rounded-xl px-4 py-3 text-black bg-gradient-to-r from-purple-50 to-pink-50 focus:border-purple-500 focus:outline-none transition-all duration-200 text-lg"
              value={scenario}
              onChange={(e) => setScenario(e.target.value as Scenario)}
            >
              <option value="">🎪 Off</option>
              <option value="At School">🏫 At School</option>
              <option value="At Store">🛒 At Store</option>
              <option value="At Home">🏠 At Home</option>
            </select>
          </div>

          {/* Language Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-lg font-semibold text-blue-700 flex items-center gap-2">
              🌍 Response Language
            </label>
            <select
              className="border-2 border-blue-300 rounded-xl px-4 py-3 text-black bg-gradient-to-r from-blue-50 to-cyan-50 focus:border-blue-500 focus:outline-none transition-all duration-200 text-lg"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
            >
              <option value="English">🇺🇸 English</option>
              <option value="Hindi">🇮🇳 Hindi</option>
              <option value="Marathi">🇮🇳 Marathi</option>
              <option value="Gujarati">🇮🇳 Gujarati</option>
              <option value="Tamil">🇮🇳 Tamil</option>
              <option value="Spanish">🇪🇸 Spanish</option>
            </select>
          </div>
        </div>

        {/* Microphone Selection */}
        {supportsRecording && (
          <div className="mt-4">
            <label className="text-lg font-semibold text-green-700 flex items-center gap-2">
              🎤 Microphone
            </label>
            <select
              className="border-2 border-green-300 rounded-xl px-4 py-3 text-black bg-gradient-to-r from-green-50 to-emerald-50 focus:border-green-500 focus:outline-none transition-all duration-200 text-lg w-full"
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              title="Microphone"
            >
              <option value="">🎤 Default Microphone</option>
              {inputDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || `🎤 Mic ${d.deviceId.slice(-4)}`}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Recording Controls */}
      <div className="flex items-center gap-6">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-4 border-green-300"
            disabled={loading || !supportsRecording}
          >
            🎤 Start Talking!
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-full px-8 py-4 text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-4 border-red-300 animate-pulse"
          >
            ⏹ Stop Recording
          </button>
        )}
      </div>

      {/* Conversation Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* User's Speech */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-4 border-blue-300 shadow-lg">
          <h2 className="text-2xl font-bold text-blue-800 mb-4 flex items-center gap-2">
            🗣️ You Said
          </h2>
          <div className="bg-white rounded-xl p-4 min-h-[120px] border-2 border-blue-200">
            <pre className="whitespace-pre-wrap text-lg text-blue-900 font-medium">{transcript || "🎤 Click 'Start Talking!' and speak!"}</pre>
          </div>
        </div>

        {/* Genie's Response */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-4 border-purple-300 shadow-lg">
          <h2 className="text-2xl font-bold text-purple-800 mb-4 flex items-center gap-2">
            🧞‍♂️ Genie Replied
          </h2>
          <div className="bg-white rounded-xl p-4 min-h-[120px] border-2 border-purple-200">
            <pre className="whitespace-pre-wrap text-lg text-purple-900 font-medium">{assistant || "✨ I'm ready to help you learn English!"}</pre>
          </div>
        </div>
      </div>

      {/* Audio Player */}
      {audioUrl && (
        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-6 border-4 border-yellow-300 shadow-lg">
          <h3 className="text-xl font-bold text-orange-800 mb-3 flex items-center gap-2">
            🔊 Listen to Genie
          </h3>
          <audio className="w-full" src={audioUrl} controls />
        </div>
      )}

      {/* Status Messages */}
      {loading && (
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-4 border-2 border-blue-300 shadow-lg">
          <div className="text-lg text-blue-800 font-semibold flex items-center gap-2">
            🔄 Processing... Please wait!
          </div>
        </div>
      )}

      {error && (
        <div className="bg-gradient-to-r from-red-100 to-pink-100 rounded-2xl p-4 border-2 border-red-300 shadow-lg max-w-2xl text-center">
          <div className="text-lg text-red-800 font-semibold flex items-center gap-2">
            ⚠️ {error}
          </div>
        </div>
      )}
    </div>
  );
}
