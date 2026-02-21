# 🎵 Mood Playground  

Mood Playground is an interactive web application that detects a user’s **mood** through text or voice input and responds with personalized greetings, themes, and curated music. It combines **AI integration**, **manual fallbacks**, and **voice recognition** to create a fun, reliable, and multilingual companion experience.  

---

## ✨ Features  

- **Mood Discovery Quiz**  
  - Step‑by‑step questions to analyze the user’s mood.  
  - AI‑powered detection with fallback keyword heuristics.  

- **AI Mood Analysis**  
  - Uses Hugging Face models (Mistral‑7B, Flan‑T5) for real‑time mood and general queries.  
  - Fallback to manual keyword detection when APIs fail.  

- **Manual Fallback System**  
  - Keyword‑based detection for moods and names in **Tamil** and **English**.  
  - Contextual responses (greetings, music, help, thanks) with randomized replies for natural feel.  

- **Music Player**  
  - Circular playlist logic (inspired by circular queue).  
  - Next/Previous song navigation with error handling for empty or broken files.  

- **Multilingual Support**  
  - Tamil (`ta-IN`) and English (`en-US`).  
  - Language preference stored in `localStorage` so users don’t need to reset each visit.  

- **Voice Recognition**  
  - Speech input via `SpeechRecognition` API.  
  - Detects mood directly from spoken words.  
  - Dynamic language support (Tamil/English).  

- **User Experience Enhancements**  
  - Typewriter effect for AI responses.  
  - Animated AI logo while “thinking” or “listening.”  
  - Emoji mood buttons as a backup to text/voice input.  

---

## 🛠️ Tech Stack  

- **Frontend:** HTML, CSS (1000+ lines for styling, responsiveness, and animations)  
- **Logic:** JavaScript (1500+ lines for mood detection, AI integration, and player logic)  
- **APIs:**  
  - Hugging Face Inference API (Mistral‑7B, Flan‑T5)  
  - Web Speech API (SpeechRecognition, SpeechSynthesis)  
  - HTML5 Audio API  

---

## ⚙️ How It Works  

1. **User Input** → Text or Voice.  
2. **Mood Detection** → AI analysis → fallback heuristic → manual keyword detection.  
3. **Response** → Personalized greeting, theme change, curated music.  
4. **Music Player** → Circular playlist ensures continuous playback.  
5. **Language Handling** → Tamil/English auto‑saved in local storage.  

---

## 🚀 Future Improvements  

- Expand keyword detection with NLP libraries.  
- Add more moods and curated playlists.  
- Improve error handling with user‑friendly UI messages.  
- Cloud deployment for faster AI responses.  

---

## 📌 Notes  

- Every line of code has meaning — the project combines **research, references, and real implementation**.  
- Total effort: ~2500 lines of code (JS + CSS).  
- Built with patience, problem‑solving, and creativity to make technology feel like a **companion**.  

---

## 👨‍💻 About Me  

I am an aspiring backend developer passionate about building scalable systems and learning step by step through practical projects.  

**My journey so far:**  
- **Bus Reservation System (Collections)** → learned object‑oriented design and CRUD with in‑memory data.  
- **Bank Management System (Collections)** → explored transactions, validations, and business rules.  
- **Student Management System (JDBC)** → leveled up to persistence, schema design, and transaction safety.  
- **Servlets & JSP (Current Grind)** → transitioning from console‑based Java to web backend engineering, deploying apps on Tomcat, and preparing for Spring Boot.  

I enjoy polishing my code for clarity, designing professional outputs, and making technical growth fun.  
This repo is part of my continuous learning path toward web development, enterprise systems, and beyond 🚀.  

---
