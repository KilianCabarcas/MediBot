#!/bin/bash

# Start Ollama in the background.
/bin/ollama serve &

# Record Process ID.
pid=$!

# Pause for Ollama to start.
sleep 5

echo "🔴 Retrieve llama3 model..."
ollama pull llama3
echo "🟢 Done!"

echo "🔴 Retrieve nomic-embed-text model..."
ollama pull nomic-embed-text
echo "🟢 Done!"

# Wait for Ollama process to finish.
wait $pid
