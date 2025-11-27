# MediBot LocalRAG 🏥🤖

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-black?style=flat&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)
![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=flat&logo=langchain&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-White?style=flat&logo=ollama&logoColor=black)

**MediBot LocalRAG** es un prototipo de asistente médico inteligente que utiliza arquitectura RAG (Retrieval-Augmented Generation) para responder preguntas basadas en documentos médicos proporcionados por el usuario. Todo el sistema se ejecuta **100% localmente** utilizando Docker y Ollama, garantizando la privacidad de los datos.

## ✨ Características

-   **Privacidad Total**: Ejecución local sin enviar datos a la nube.
-   **Arquitectura RAG**: Respuestas fundamentadas en tus propios documentos (PDF, TXT).
-   **Interfaz Moderna**: UI intuitiva y responsiva construida con Next.js y TailwindCSS.
-   **Backend Ligero**: FastAPI + LangChain optimizado para bajo consumo de recursos.
-   **Ollama Integrado**: No requiere instalación manual de Ollama; se ejecuta automáticamente en un contenedor.

## 🚀 Requisitos Previos

1.  **Docker & Docker Compose**: [Instalar Docker Desktop](https://www.docker.com/products/docker-desktop/).

## 🛠️ Instalación y Ejecución

### 1. Clonar y Ejecutar

```bash
git clone https://github.com/tu-usuario/medibot-localrag.git
cd medibot-localrag

# Construir y levantar los contenedores
docker-compose up --build
```

> [!IMPORTANT]
> **Primera Ejecución**: La primera vez que inicies el proyecto, el contenedor de Ollama descargará automáticamente los modelos `llama3` y `nomic-embed-text`. Esto puede tardar varios minutos dependiendo de tu conexión a internet. Verás el progreso en los logs de la terminal.

### 2. Usar la Aplicación

-   **Chat UI**: Abre [http://localhost:3000](http://localhost:3000) en tu navegador.
-   **API Docs**: Disponibles en [http://localhost:8000/docs](http://localhost:8000/docs).

## 📖 Guía de Uso

1.  **Carga de Documentos**:
    -   En la interfaz de chat, haz clic en el botón "Subir Guías".
    -   Selecciona tus archivos PDF o TXT (ej. protocolos de triaje, guías de medicamentos).
    -   Espera la confirmación de carga.

2.  **Consultas**:
    -   Escribe tu pregunta médica en el chat.
    -   MediBot analizará los documentos y generará una respuesta basada en el contexto encontrado.

## 🏗️ Arquitectura

El proyecto consta de 4 contenedores orquestados por Docker Compose:

1.  **Frontend (`chatbot-ui`)**: Next.js 14 (App Router) + TailwindCSS.
2.  **Backend (`api-rag`)**: FastAPI + LangChain.
3.  **Vector DB (`vector-db`)**: ChromaDB para almacenamiento de vectores.
4.  **LLM Service (`ollama`)**: Servidor de modelos de lenguaje local.

## ⚠️ Descargo de Responsabilidad

**MediBot es una herramienta de apoyo informativo.** No sustituye el juicio clínico profesional. Consulte siempre a un médico calificado para diagnóstico y tratamiento.


