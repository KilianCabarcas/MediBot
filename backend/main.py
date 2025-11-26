import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import shutil
import tempfile

from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OllamaEmbeddings

from langchain_chroma import Chroma
from langchain_community.chat_models import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

app = FastAPI(title="MediBot LocalRAG API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
CHROMA_DB_DIR = "./chroma_db"
COLLECTION_NAME = "medibot_knowledge"
# EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2" # Removed
LLM_MODEL = "llama3" 
EMBEDDING_MODEL = "nomic-embed-text" # User must pull this
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")

# Initialize Embeddings
embeddings = OllamaEmbeddings(model=EMBEDDING_MODEL, base_url=OLLAMA_BASE_URL)

# Initialize Vector Store (Chroma)
# We use a persistent client that connects to the vector-db service if possible, 
# but for simplicity in this prototype, we can also use a local persistent directory 
# mounted via Docker volume, or connect to a Chroma server.
# The user requested a separate vector-db container. 
# If using a separate container (HttpClient), we need the host and port.
# However, langchain-chroma's `Chroma` class usually works with a local directory or a client.
# Let's try to connect to the HTTP server if configured, otherwise fallback or error.
# For now, let's assume we are using the HttpClient pattern if we want to separate it strictly,
# but standard `Chroma(persist_directory=...)` runs IN the backend container.
# The user asked for a "vector-db" container. That usually implies running Chroma as a server.
# So we should use `chromadb.HttpClient`.

import chromadb
from chromadb.config import Settings

# We will initialize this lazily or globally
# Note: LangChain's Chroma wrapper supports passing a client.

def get_vectorstore():
    # Connect to the vector-db container
    # Service name in docker-compose is 'vector-db', port 8000
    client = chromadb.HttpClient(host='vector-db', port=8000)
    return Chroma(
        client=client,
        collection_name=COLLECTION_NAME,
        embedding_function=embeddings,
    )

# Initialize LLM
llm = ChatOllama(
    model=LLM_MODEL,
    base_url=OLLAMA_BASE_URL
)

class ChatRequest(BaseModel):
    question: str

@app.get("/")
def read_root():
    return {"status": "ok", "message": "MediBot API is running"}

@app.post("/api/ingest_data")
async def ingest_data(files: List[UploadFile] = File(...)):
    try:
        documents = []
        with tempfile.TemporaryDirectory() as temp_dir:
            for file in files:
                file_path = os.path.join(temp_dir, file.filename)
                with open(file_path, "wb") as f:
                    shutil.copyfileobj(file.file, f)
                
                if file.filename.endswith(".pdf"):
                    loader = PyPDFLoader(file_path)
                else:
                    loader = TextLoader(file_path)
                
                documents.extend(loader.load())

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = text_splitter.split_documents(documents)

        vectorstore = get_vectorstore()
        vectorstore.add_documents(chunks)

        return {"message": f"Successfully ingested {len(chunks)} chunks from {len(files)} files."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        vectorstore = get_vectorstore()
        retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

        template = """Tu rol es el de un Asistente de Apoyo Informativo, no un médico con licencia. 
Nunca debes dar un diagnóstico directo o reemplazar la consulta profesional. 

Usa el siguiente contexto para responder a la pregunta del usuario.
Si no sabes la respuesta, di que no lo sabes, no inventes.

Contexto:
{context}

Pregunta:
{question}

Debes terminar SIEMPRE tu respuesta con el siguiente descargo de responsabilidad: 
'Esta información es solo de apoyo. Consulte a un profesional médico para un diagnóstico y tratamiento.'
"""
        prompt = ChatPromptTemplate.from_template(template)

        chain = (
            {"context": retriever, "question": RunnablePassthrough()}
            | prompt
            | llm
            | StrOutputParser()
        )

        response = chain.invoke(request.question)
        return {"answer": response}

    except Exception as e:
        # Log the error for debugging
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))
