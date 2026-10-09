"use client";

import * as React from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "./button";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  buttonText?: string;
}

export function VoiceInput({
  onTranscript,
  className = "",
  size = "default",
  buttonText = "Dictar por voz",
}: VoiceInputProps) {
  const [isListening, setIsListening] = React.useState(false);
  const [isSupported, setIsSupported] = React.useState(true);

  // Mantener el estado en una ref para que los callbacks del recognition lo lean siempre actualizado
  const isListeningRef = React.useRef(false);
  const recognitionRef = React.useRef<any>(null);

  React.useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Mantener siempre abierto
    recognition.interimResults = false;
    recognition.lang = "es-ES";

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
    };

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript;
          if (transcript && transcript.trim()) {
            onTranscript(transcript.trim());
          }
        }
      }
    };

    recognition.onerror = (event: any) => {
      // Ignorar 'no-speech' para no cortar el dictado si el usuario hace una pausa
      if (event.error === "no-speech") {
        return;
      }
      console.warn("Speech API event:", event.error);
    };

    recognition.onend = () => {
      // Si el usuario NO apagó el micro, reanudar inmediatamente para evitar cortes involuntarios
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          // Ya iniciado o reiniciando
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [onTranscript]);

  const toggleListen = () => {
    if (!isSupported) {
      alert("El dictado por voz no está soportado en este navegador. Puedes escribir el texto directamente.");
      return;
    }

    if (isListeningRef.current) {
      // Apagar explícitamente
      isListeningRef.current = false;
      setIsListening(false);
      try {
        recognitionRef.current?.stop();
      } catch {}
    } else {
      // Encender de forma continua
      isListeningRef.current = true;
      setIsListening(true);
      try {
        recognitionRef.current?.start();
      } catch {
        try {
          recognitionRef.current?.abort();
          setTimeout(() => {
            if (isListeningRef.current) recognitionRef.current?.start();
          }, 100);
        } catch {}
      }
    }
  };

  if (size === "icon") {
    return (
      <button
        type="button"
        onClick={toggleListen}
        title={isListening ? "Pulsar para detener el micrófono" : "Pulsar para dictar continuo con manos ocupadas"}
        className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-medium transition-all cursor-pointer ${
          isListening
            ? "bg-rose-600 text-white shadow-lg shadow-rose-500/40 ring-4 ring-rose-300 dark:ring-rose-900 animate-pulse"
            : "bg-orange-600 text-white hover:bg-orange-700 shadow-md shadow-orange-500/20"
        } ${className}`}
      >
        {isListening ? (
          <>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <Mic className="h-5 w-5" />
          </>
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </button>
    );
  }

  return (
    <Button
      type="button"
      onClick={toggleListen}
      variant={isListening ? "destructive" : "orange"}
      size={size}
      className={`relative gap-2 ${
        isListening ? "ring-4 ring-rose-300 dark:ring-rose-900 shadow-lg shadow-rose-500/30 animate-pulse" : ""
      } ${className}`}
    >
      {isListening ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Grabando continuo (toca para parar)</span>
          <MicOff className="h-4 w-4 ml-1" />
        </>
      ) : (
        <>
          <Mic className="h-4 w-4" />
          <span>{buttonText}</span>
        </>
      )}
    </Button>
  );
}
