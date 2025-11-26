'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Upload, FileText, Loader2, Bot, User, Activity, ShieldCheck, Stethoscope } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for Tailwind classes
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/api/chat', {
        question: userMessage,
      });

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.data.answer },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Error: Could not get a response from the server.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const response = await axios.post(
        'http://localhost:8000/api/ingest_data',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setUploadStatus(response.data.message);
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadStatus('Error uploading files.');
    } finally {
      setIsUploading(false);
      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const [systemStatus, setSystemStatus] = useState<'checking' | 'ready' | 'installing' | 'unavailable'>('checking');
  const [statusDetails, setStatusDetails] = useState<string>('');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/status');
        const { status, details } = response.data;
        setSystemStatus(status);
        setStatusDetails(details);
      } catch (error) {
        console.error('Error checking system status:', error);
        setSystemStatus('unavailable');
        setStatusDetails('Could not connect to the backend server.');
      }
    };

    // Initial check
    checkStatus();

    // Poll every 5 seconds if not ready
    const interval = setInterval(() => {
      if (systemStatus !== 'ready') {
        checkStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [systemStatus]);



  if (systemStatus !== 'ready') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 font-sans text-slate-900 p-6">
        <div className="flex flex-col items-center max-w-md text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-teal-200 opacity-75"></div>
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-teal-100 text-teal-600">
              {systemStatus === 'checking' ? (
                <Loader2 size={40} className="animate-spin" />
              ) : systemStatus === 'installing' ? (
                <Upload size={40} className="animate-bounce" />
              ) : (
                <Activity size={40} />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-800">
              {systemStatus === 'checking' && 'Conectando con MediBot...'}
              {systemStatus === 'installing' && 'Instalando Modelos de IA...'}
              {systemStatus === 'unavailable' && 'Sistema No Disponible'}
            </h1>
            <p className="text-slate-500">
              {statusDetails || 'Por favor espere mientras verificamos el estado del sistema.'}
            </p>
          </div>

          {systemStatus === 'unavailable' && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-100">
              <p className="font-semibold">Posibles causas:</p>
              <ul className="list-disc list-inside mt-1 space-y-1 text-left">
                <li>El servidor backend no se está ejecutando.</li>
                <li>Ollama no está instalado o no se está ejecutando.</li>
                <li>Problemas de conexión de red.</li>
              </ul>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 w-full rounded-md bg-red-100 px-4 py-2 font-medium text-red-700 hover:bg-red-200 transition-colors"
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-600/20">
            <Stethoscope size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">MediBot <span className="text-teal-600">AI</span></h1>
            <p className="text-xs font-medium text-slate-500">Asistente Médico Inteligente</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {uploadStatus && (
            <span className={cn(
              "text-xs px-3 py-1.5 rounded-full font-medium animate-in fade-in slide-in-from-top-2",
              uploadStatus.includes("Error") ? "bg-red-100 text-red-700" : "bg-teal-50 text-teal-700 border border-teal-100"
            )}>
              {uploadStatus}
            </span>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="group flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="animate-spin text-teal-600" size={16} /> : <Upload size={16} className="text-slate-400 transition-colors group-hover:text-teal-600" />}
            <span>Subir Guías</span>
          </button>
          <input
            type="file"
            multiple
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            accept=".pdf,.txt"
          />
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        <div className="mx-auto max-w-3xl space-y-8">
          {messages.length === 0 && (
            <div className="mt-20 flex flex-col items-center justify-center text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-teal-50 text-teal-600 ring-8 ring-teal-50/50">
                <Activity size={48} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">¡Bienvenido a MediBot AI!</h2>
              <p className="mt-2 max-w-md text-slate-500">
                Tu asistente para consultas rápidas sobre protocolos y guías médicas.
                Sube tus documentos para empezar.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <FileText size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-700">Ingesta de Datos</p>
                    <p className="text-xs text-slate-400">Soporte para PDF y TXT</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-700">Seguridad</p>
                    <p className="text-xs text-slate-400">Ejecución 100% Local</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={cn(
                "flex w-full gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "flex max-w-[85%] flex-col gap-2 rounded-2xl px-6 py-5 shadow-sm",
                  msg.role === 'user'
                    ? "bg-teal-600 text-white rounded-br-none"
                    : "bg-white text-slate-800 border border-slate-100 rounded-bl-none"
                )}
              >
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-80">
                  {msg.role === 'user' ? (
                    <>
                      <span>Tú</span>
                      <User size={12} />
                    </>
                  ) : (
                    <>
                      <Bot size={12} />
                      <span>MediBot</span>
                    </>
                  )}
                </div>
                <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex w-full justify-start gap-4 animate-pulse">
              <div className="flex max-w-[85%] flex-col gap-2 rounded-2xl rounded-bl-none bg-white px-6 py-5 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-80 text-slate-800">
                  <Bot size={12} />
                  <span>MediBot</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  <Loader2 className="animate-spin text-teal-600" size={18} />
                  <span className="text-sm font-medium">Analizando Mensaje ...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 border-t border-slate-200 bg-white/90 p-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-sm focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-100 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Escribe tu consulta médica aquí..."
            className="flex-1 bg-transparent px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/20 transition-all hover:bg-teal-700 hover:shadow-lg disabled:bg-slate-300 disabled:shadow-none"
          >
            <Send size={20} />
          </button>
        </div>
        <div className="mt-3 text-center">
          <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-400">
            <ShieldCheck size={12} />
            <span>Advertencia: MediBot es una herramienta de apoyo. Consulte siempre a un profesional médico.</span>
          </p>
        </div>
      </div>
    </main>
  );
}
