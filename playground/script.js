/**
 * Mood Playground - Loki Technologies
 * Core JavaScript Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const moodBtns = document.querySelectorAll('.mood-btn');
    const moodTextInput = document.getElementById('mood-text-input');
    const voiceInputBtn = document.getElementById('voice-input-btn');
    const aiResponse = document.getElementById('ai-response').querySelector('p');

    // Protocol Check: Warn if running via file:// (CORS blocker)
    if (window.location.protocol === 'file:') {
        const corsWarning = "Note: AI features may be blocked when opening the file directly. Please use a local server.";
        aiResponse.textContent = corsWarning;
        console.warn("CORS Risk: Running via file:// protocol. AI API calls will likely fail.");
    }
    const songTitle = document.getElementById('song-title');
    const moodLabel = document.getElementById('mood-label');
    const wallpaperOverlay = document.getElementById('wallpaper-overlay');
    const audioPlayer = document.getElementById('audio-player');
    const aiLogo = document.getElementById('ai-logo');
    const particlesContainer = document.getElementById('particles');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const playerBar = document.querySelector('.player-bar');
    const langBtns = document.querySelectorAll('.lang-btn');
    const discoveryBtn = document.getElementById('mood-discovery-btn');
    const discoveryOptionsGrid = document.getElementById('discovery-options');
    const situationSection = document.getElementById('situation-section');
    const situationBtn = document.getElementById('situation-video-btn');
    const videoModal = document.getElementById('video-modal');
    const situationVideo = document.getElementById('situation-video');
    const closeModalBtn = document.getElementById('close-modal');
    const videoPrevBtn = document.getElementById('video-prev-btn');
    const videoPlayPauseBtn = document.getElementById('video-play-pause-btn');
    const videoNextBtn = document.getElementById('video-next-btn');

    // State Management
    let currentLang = localStorage.getItem('appLang') || 'ta';
    let currentMood = localStorage.getItem('userMood') || null;
    let quoteInterval = null;
    let typewriterTimeout = null; // To handle cancellation
    let pendingMoodAction = null; // To handle sequence: Video -> AI Speech -> Music

    // Situation Video State
    let currentSituationIndex = 0;
    let currentSituationPlaylist = [];
    let hasPlayedVideoInSession = false; // Flag to track if video has played for current mood trigger

    // Mood Discovery Session State
    let isDiscoveryMode = false;
    let discoveryStep = 0;
    let discoveryResponses = [];

    // Chat AI History
    let chatHistory = []; // Stores objects: { role: 'user'|'assistant', text: '...' }

    // Music control state
    let pendingMusicMood = null;

    // Each option is tagged with the mood it strongly signals.
    // moodMap[i] = mood weight array matching the options of question i.
    const discoveryQuestions = {
        en: [
            {
                q: "How did you feel when you woke up this morning?",
                options: ["Restless and frustrated", "Full of energy and excitement", "Very slow and sad", "Calm and peaceful"],
                moodMap: ['angry', 'energetic', 'sad', 'relaxed']
            },
            {
                q: "What's the main thing on your mind right now?",
                options: ["A special someone or love", "Work, goals, and success", "A problem that is bothering me", "I'm just vibing and relaxing"],
                moodMap: ['romantic', 'motivation', 'sad', 'relaxed']
            },
            {
                q: "If you had to describe your energy level, what would it be?",
                options: ["Super high - Ready to dance!", "Determined and focused", "Low - Just want to hide", "Stable and balanced"],
                moodMap: ['energetic', 'motivation', 'alone', 'relaxed']
            },
            {
                q: "What kind of weather matches your current vibe?",
                options: ["Bright sunshine", "Thunder and lightning", "Gentle rain and sadness", "Cloudy and mysterious"],
                moodMap: ['happy', 'angry', 'sad', 'alone']
            },
            {
                q: "Which best describes your mood right now?",
                options: ["Joyful and celebratory!", "Inspired and driven", "Heartbroken or in need of comfort", "In love or thinking of someone special"],
                moodMap: ['happy', 'motivation', 'sad', 'romantic']
            },
            {
                q: "What do you need right now?",
                options: ["A celebration with confetti!", "Motivation to keep going", "A hug or some comfort", "To just be alone in my thoughts"],
                moodMap: ['happy', 'motivation', 'sad', 'alone']
            },
            {
                q: "How would you describe your inner world right now?",
                options: ["Peaceful and spiritual", "Angry and restless", "In love and warm", "Energized and unstoppable"],
                moodMap: ['devotional', 'angry', 'romantic', 'energetic']
            }
        ],
        ta: [
            {
                q: "இன்று காலை எழுந்தபோது நீங்கள் எப்படி உணர்ந்தீர்கள்?",
                options: ["நிம்மதியின்றி மற்றும் ஏமாற்றமாக", "ஆற்றல் மற்றும் உற்சாகத்துடன்", "மிகவும் நிதானமாக மற்றும் சோர்வாக", "அமைதி மற்றும் நிம்மதியாக"],
                moodMap: ['angry', 'energetic', 'sad', 'relaxed']
            },
            {
                q: "இப்போது உங்கள் மனதில் ஓடும் முக்கியமான விஷயம் என்ன?",
                options: ["ஒரு சிறப்பு நபர் அல்லது காதல்", "வேலை, இலக்குகள் மற்றும் வெற்றி", "என்னைத் தொந்தரவு செய்யும் ஒரு பிரச்சனை", "நான் சும்மா ரிலாக்ஸாக இருக்கிறேன்"],
                moodMap: ['romantic', 'motivation', 'sad', 'relaxed']
            },
            {
                q: "உங்கள் ஆற்றல் அளவை எப்படி விவரிப்பீர்கள்?",
                options: ["மிகவும் அதிகம் - ஆடத் தயார்!", "உறுதி மற்றும் கவனம்", "குறைவு - மறைந்து கொள்ள விரும்புகிறேன்", "நிலையான மற்றும் சீரான"],
                moodMap: ['energetic', 'motivation', 'alone', 'relaxed']
            },
            {
                q: "இப்போது உங்கள் மனநிலைக்கு எந்தத் காலநிலை பொருந்தும்?",
                options: ["பிரகாசமான சூரிய ஒளி", "இடி மற்றும் மின்னல்", "லேசான மழை மற்றும் சோகம்", "மேகமூட்டம் மற்றும் மர்மமானது"],
                moodMap: ['happy', 'angry', 'sad', 'alone']
            },
            {
                q: "இப்போது உங்கள் மனநிலை எவ்வாறு உள்ளது?",
                options: ["மகிழ்ச்சியாகவும் கொண்டாட்டமாகவும்!", "ஊக்கம் மற்றும் உந்துதலுடன்", "இதயம் வலிக்கிறது அல்லது ஆறுதல் தேவை", "காதல் அல்லது யாரையாவது நினைத்துக்கொண்டிருக்கிறேன்"],
                moodMap: ['happy', 'motivation', 'sad', 'romantic']
            },
            {
                q: "இப்போது உங்களுக்கு என்ன தேவை?",
                options: ["கொண்டாட்டம் மற்றும் கொண்டாட்டம்!", "தொடர்ந்து முன்னேற உத்வேகம்", "ஒரு கட்டிப்பிடிப்பு அல்லது ஆறுதல்", "தனிமையில் சிந்திக்க விரும்புவது"],
                moodMap: ['happy', 'motivation', 'sad', 'alone']
            },
            {
                q: "இப்போது உங்கள் உள்ளுணர்வு எப்படி உள்ளது?",
                options: ["அமைதி மற்றும் பக்திமயமாக", "கோபம் மற்றும் அமைதியின்மை", "காதல் மற்றும் அன்பு", "ஆற்றல் மற்றும் உற்சாகம்"],
                moodMap: ['devotional', 'angry', 'romantic', 'energetic']
            }
        ]
    };

    // Speech Synthesis Setup
    const synth = window.speechSynthesis;
    let femaleVoice = null;
    let tamilVoice = null;
    let englishVoice = null;

    function loadVoices() {
        const voices = synth.getVoices();

        // Priority for Tamil Female Voice
        tamilVoice = voices.find(v => v.lang.includes('ta-IN') && (v.name.includes('Female') || v.name.includes('Google') || v.name.includes('Pallavi'))) ||
            voices.find(v => v.lang.includes('ta'));

        // Priority for Indian English Female Voice
        englishVoice = voices.find(v => v.lang.includes('en-IN') && (v.name.includes('Female') || v.name.includes('Google') || v.name.includes('Heera'))) ||
            voices.find(v => v.lang.includes('en-IN')) ||
            voices.find(v => v.lang.includes('en'));

        updateVoiceForLanguage();
    }

    function updateVoiceForLanguage() {
        femaleVoice = (currentLang === 'ta') ? tamilVoice : englishVoice;
    }

    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
    }
    loadVoices();

    function speak(text, callback = null) {
        // Prevent AI from speaking if video modal is active
        if (videoModal && videoModal.classList.contains('active')) {
            console.log("AI speech blocked: Video is playing.");
            return;
        }

        // Cancel any pending speech immediately to reduce delay
        synth.cancel();

        // Symbol Filtering: Remove emojis and special characters for cleaner speech
        const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
            .replace(/[#*^|]/g, '')
            .trim();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        if (femaleVoice) utterance.voice = femaleVoice;
        utterance.pitch = 1.0;
        utterance.rate = 1.05;

        // Audio Ducking: Reduce volume when speaking
        const originalVolume = audioPlayer.volume;
        utterance.onstart = () => {
            aiLogo.classList.add('speaking');
            audioPlayer.volume = 0.2; // Duck volume to 20%
        };

        utterance.onend = () => {
            aiLogo.classList.remove('speaking');
            audioPlayer.volume = originalVolume; // Restore volume
            if (callback) callback();
        };

        // Use a small timeout to let the browser clear previous states effectively
        setTimeout(() => {
            synth.speak(utterance);
        }, 50);
    }

    // Typewriter effect with cancellation support
    function typeWriter(element, text, speed = 20) {
        if (typewriterTimeout) {
            clearTimeout(typewriterTimeout);
        }

        element.textContent = '';
        let i = 0;
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                typewriterTimeout = setTimeout(type, speed);
            } else {
                typewriterTimeout = null;
            }
        }
        type();
    }

    // Helper: Shuffle Array (Fisher-Yates)
    function shuffleArray(array) {
        const newArr = [...array];
        for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
        }
        return newArr;
    }

    // Mood Data Configuration (Expanded)
    const moods = {
        happy: {
            emoji: '😀',
            color: '#ffbe0b',
            wallpaper: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=1600")',
            response: {
                ta: "ஆஹா! இதைக் கேட்க மிகவும் மகிழ்ச்சியாக இருக்கிறது! இந்த உற்சாகத்தைத் தொடர்வோம்!",
                en: "Yay! That's wonderful to hear! Let's keep that energy high!"
            },
            songs: [
                { title: "Aaluma Doluma", src: "music/Happy/Aaluma Doluma (Song, Anirudh Ravichander, Badshah).m4a" },
                { title: "Aanandha Yaazhai", src: "music/Happy/Aanandha Yaazhai Video  Ram  Yuvanshankar Raja (Yuvan Shankar Raja, Sriram Parthasarathy).m4a" },
                { title: "Be Free", src: "music/Happy/Be Free (Lyrical Video) - Pallivaalu Bhadravattakam (Vidya Vox Mashup) (ft. Vandana Iyer) (Video, I'm Official).m4a" },
                { title: "Buttabomma", src: "music/Happy/Buttabomma (feat. Allu Arjun & Pooja Hegde) (Armaan Malik).m4a" },
                { title: "Chammak Challo", src: "music/Happy/Chammak Challo (Akon, Hamsika Iyer).m4a" },
                { title: "Chinna Chinna Aasai", src: "music/Happy/Chinna Chinna Aasai Lyric Video  சின்னச் சின்ன ஆசை  Roja Movie (Video, Tamil Movieplex).m4a" },
                { title: "Jimikki Kammal", src: "music/Happy/Jimikki Kammal   Velipadinte Pusthakam (Amrita Movies).m4a" },
                { title: "Kasu Panam", src: "music/Happy/Kasu Panam (From Soodhu Kavvum) (Anthony Daasan, Gana Bala).m4a" },
                { title: "Oyaayiye Yaayiye", src: "music/Happy/Oyaayiye Yaayiye (Benny Dayal, Haricharan, Chinmayi, Saindhavi).m4a" },
                { title: "Single Pasanga", src: "music/Happy/Single Pasanga (Kaka Balachandar, Gana Ulagam Dharani, Arivu).m4a" }
            ],
            quotes: {
                ta: [
                    { text: "மகிழ்ச்சி என்பது ஏற்கனவே உருவான ஒன்றல்ல. அது உங்கள் சொந்த செயல்களிலிருந்து வருகிறது.", author: "தலாய் லாமா" },
                    { text: "வாழ்க்கையை ரசிப்பதே மிக முக்கியமான விஷயம் - மகிழ்ச்சியாக இருப்பது - அதுவே முக்கியம்.", author: "ஆட்ரி ஹெப்பர்ன்" },
                    { text: "ஒவ்வொரு நிமிடம் நீங்கள் கோபப்படும்போதும் அறுபது வினாடி மகிழ்ச்சியை இழக்கிறீர்கள்.", author: "ரால்ப் வால்டோ எமர்சன்" },
                    { text: "உன்னால் முடியும் என்று நம்பு, நீ பாதி தூரத்தை கடந்துவிட்டாய்.", author: "தியோடர் ரூஸ்வெல்ட்" },
                    { text: "புன்னகை என்பது எந்தவொரு மொழியிலும் ஒரு சிறந்த வரவேற்பு.", author: "தெரியவில்லை" },
                    { text: "வாழ்வின் மிக உயர்ந்த மகிழ்ச்சி நாம் நேசிக்கப்படுகிறோம் என்ற நம்பிக்கை.", author: "விக்டர் ஹ்யூகோ" },
                    { text: "மகிழ்ச்சி என்பது ஒரு இலக்கு அல்ல, அது ஒரு பயணம்.", author: "தெரியவில்லை" },
                    { text: "உங்கள் முகத்தை எப்போதும் சூரிய ஒளியை நோக்கி வைத்திருங்கள் - நிழல்கள் உங்களுக்கு பின்னால் விழும்.", author: "வால்ட் விட்மேன்" },
                    { text: "எல்லா மகிழ்ச்சியும் தைரியத்தையும் வேலையையும் சார்ந்தது.", author: "ஹானோர் டி பால்சாக்" },
                    { text: "மகிழ்ச்சி என்பது உங்கள் எண்ணங்கள், வார்த்தைகள் மற்றும் செயல்கள் இணக்கமாக இருக்கும்போது கிடைக்கும்.", author: "மகாத்மா காந்தி" },
                    { text: "மிகச் சிறந்த மகிழ்ச்சி ஒருவருக்கு உதவுவதில் இருக்கிறது.", author: "தெரியவில்லை" },
                    { text: "இன்று ஒரு அழகான நாள், அதை மகிழ்ச்சியுடன் தொடங்குவோம்.", author: "தெரியவில்லை" },
                    { text: "உங்களிடம் உள்ளதை வைத்து மகிழுங்கள், இல்லாததிற்கு வருத்தப்படாதீர்கள்.", author: "தெரியவில்லை" }
                ],
                en: [
                    { text: "Happiness is not something readymade. It comes from your own actions.", author: "Dalai Lama" },
                    { text: "The most important thing is to enjoy your life—to be happy—it's all that matters.", author: "Audrey Hepburn" },
                    { text: "For every minute you are angry you lose sixty seconds of happiness.", author: "Ralph Waldo Emerson" },
                    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
                    { text: "A smile is the universal welcome.", author: "Max Eastman" },
                    { text: "The supreme happiness of life is the conviction that we are loved.", author: "Victor Hugo" },
                    { text: "Happiness is a journey, not a destination.", author: "Souza" },
                    { text: "Keep your face always toward the sunshine - and shadows will fall behind you.", author: "Walt Whitman" },
                    { text: "All happiness depends on courage and work.", author: "Honore de Balzac" },
                    { text: "Happiness is when what you think, what you say, and what you do are in harmony.", author: "Mahatma Gandhi" },
                    { text: "The greatest happiness is to help someone else.", author: "Unknown" },
                    { text: "Today is a beautiful day, start it with a smile.", author: "Unknown" },
                    { text: "Enjoy what you have, don't worry about what you don't.", author: "Unknown" }
                ]
            },
            keywords: ['happy', 'happiness', 'joy', 'joyful', 'joyous', 'good', 'great', 'awesome', 'wonderful', 'amazing', 'fantastic', 'excellent', 'smiling', 'smile', 'cheerful', 'elated', 'delighted', 'thrilled', 'glad', 'pleased', 'excited', 'laughing', 'laugh', 'blessed', 'grateful', 'content', 'ecstatic', 'blissful', 'overjoyed', 'upbeat', 'bright', 'positive', 'மகிழ்ச்சி', 'சந்தோஷம்', 'கொண்டாட்டம்', 'நலமாக', 'மகிழ்வாக']
        },
        sad: {
            emoji: '😢',
            color: '#3a86ff',
            wallpaper: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("https://images.unsplash.com/photo-1428592953211-077101b2021b?auto=format&fit=crop&q=80&w=1600")',
            response: {
                ta: "நான் உங்களுடன் இருக்கிறேன். இப்படி உணருவது இயல்பானது. சில இனிமையான பாடல்களைக் கேட்போமா?",
                en: "I'm here for you. It's okay to feel this way. How about some soothing melodies?"
            },
            songs: [
                { title: "Yaen Ennai Pirindhaai", src: "music/sad/Adithya Varma  Yaen Ennai Pirindhaai Video Song (Video, Pulingo Entertainment).m4a" },
                { title: "Ava Enna", src: "music/sad/Ava Enna (Song, Harris Jayaraj).m4a" },
                { title: "Ennodu Nee Irundhaal", src: "music/sad/Ennodu Nee Irundhaal (A.R. Rahman, Sid Sriram, Sunitha Sarathy, and Kabilan).m4a" },
                { title: "Idhu Varai", src: "music/sad/Idhu Varai (Yuvan Shankar Raja, Ajesh, Andrea Jeremiah, Gangai Amaran).m4a" },
                { title: "Indru Netru Naalai", src: "music/sad/Indru Netru Naalai (Song, Hiphop Tamizha, Shankar Mahadevan, Alaap Raju).m4a" },
                { title: "Sara Sara Saara Kathu", src: "music/sad/Sara Sara Saara Kathu (Chinmayi).m4a" },
                { title: "Venmathiye", src: "music/sad/Venmathiye (Song, Tippu).m4a" },
                { title: "Venmegam", src: "music/sad/Venmegam (Song, Yuvan Shankar Raja, Hariharan, Na. Muthukumar).m4a" },
                { title: "Yamma Yamma", src: "music/sad/Yamma Yamma (Song, Harris Jayaraj).m4a" },
                { title: "Yennai Maatrum Kadhale", src: "music/sad/Yennai Maatrum Kadhale (From Naanum Rowdy Dhaan) (Anirudh Ravichander, Vignesh Shivan, Sid Sriram).m4a" }
            ],
            quotes: {
                ta: [
                    { text: "சோகம் என்பது இரண்டு தோட்டங்களுக்கு இடையே உள்ள ஒரு சுவர்.", author: "கலீல் ஜிப்ரான்" },
                    { text: "கண்ணீர் என்பது எழுதப்பட வேண்டிய வார்த்தைகள்.", author: "பாலோ கோயல்ஹோ" },
                    { text: "ஒவ்வொரு மனிதனுக்கும் உலகிற்குத் தெரியாத ரகசிய துக்கங்கள் உள்ளன.", author: "லாங்ஃபெலோ" },
                    { text: "துயரம் என்பது அன்பின் விலை.", author: "தெரியவில்லை" },
                    { text: "அதிகாலைப் பனி மறைவது போல் உங்கள் துயரம் மறையும்.", author: "தெரியவில்லை" },
                    { text: "மனம் விட்டு அழுவது மன பாரத்தை குறைக்கும்.", author: "தெரியவில்லை" },
                    { text: "மாற்றம் ஒன்றே மாறாதது, இந்த சூழலும் மாறும்.", author: "தெரியவில்லை" },
                    { text: "வாழ்வில் வலிகள் இயற்கை, ஆனால் வருந்துவது உங்கள் கையில்.", author: "தெரியவில்லை" },
                    { text: "இருள் மறைந்து ஒளி வரும் போது விடியல் பிறக்கும்.", author: "தெரியவில்லை" },
                    { text: "உங்களை மாற்றிக் கொள்ள துணிச்சல் வேண்டும்.", author: "தெரியவில்லை" },
                    { text: "கண்ணீர் என்பது ஆன்மாவின் மழை.", author: "தெரியவில்லை" },
                    { text: "துக்கம் என்பது வாழ்வின் ஒரு பகுதி.", author: "தெரியவில்லை" },
                    { text: "மீண்டும் எழுந்து ஓடத் தொடங்குங்கள்.", author: "தெரியவில்லை" }
                ],
                en: [
                    { text: "Sadness is but a wall between two gardens.", author: "Kahlil Gibran" },
                    { text: "Tears are words that need to be written.", author: "Paulo Coelho" },
                    { text: "Every man has his secret sorrows which the world knows not.", author: "Henry Wadsworth Longfellow" },
                    { text: "Grief is the price we pay for love.", author: "Unknown" },
                    { text: "This too shall pass.", author: "Persian Proverb" },
                    { text: "Crying is all right in its way while it lasts. But you have to stop sooner or later.", author: "C.S. Lewis" },
                    { text: "There is no grief like the grief that does not speak.", author: "Henry Wadsworth Longfellow" },
                    { text: "The pain of yesterday is the strength of today.", author: "Unknown" },
                    { text: "Every heart has its own ache.", author: "Unknown" },
                    { text: "When it rains, look for rainbows.", author: "Unknown" },
                    { text: "Tears are the soul's rain.", author: "Unknown" },
                    { text: "Sadness is a part of living.", author: "Unknown" },
                    { text: "Rise up and start again.", author: "Unknown" }
                ]
            },
            keywords: ['sad', 'sadness', 'unhappy', 'unhappiness', 'crying', 'cry', 'weeping', 'tears', 'low', 'down', 'blue', 'depressed', 'depression', 'lonely', 'loneliness', 'broken', 'heartbroken', 'hurt', 'pain', 'suffering', 'grief', 'grieve', 'gloomy', 'miserable', 'hopeless', 'hopelessness', 'distressed', 'sorrowful', 'melancholy', 'bad', 'terrible', 'awful', 'devastated', 'shattered', 'lost', 'empty', 'numb', 'சோகம்', 'வருத்தம்', 'கவலை', 'துக்கம்', 'அழுகிறேன்', 'சோர்வு', 'வலி']
        },
        romantic: {
            emoji: '😍',
            color: '#ff006e',
            wallpaper: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=1600")',
            response: {
                ta: "காதல் காற்றில் பறக்கிறது! ❤️ இந்த காதல் உணர்விற்காக சில இனிமையான பாடல்களை ஒலிக்கச் செய்கிறேன்.",
                en: "Love is in the air! ❤️ Let me play something sweet for this romantic vibe."
            },
            songs: [
                { title: "Ale Ale", src: "music/romantic/Ale Ale Video Song  Boys Movie  Siddharth, Genelia  Tamil Song  S.Thaman Shankar  A R Rahman (Star Music Spot).m4a" },
                { title: "High on Love", src: "music/romantic/High on Love - Prelude (Yuvan Shankar Raja).m4a" },
                { title: "Inkem Inkem Inkem Kaavaale", src: "music/romantic/Inkem Inkem Inkem Kaavaale (Song, Sid Sriram).m4a" },
                { title: "Kannadi Poovukku", src: "music/romantic/Kannadi Poovukku - Official Video  Enakku Vaaitha Adimaigal  Jai, Pranitha  Santhosh Dhayanidhi (Video, Divo Music).m4a" },
                { title: "Rowdy Baby", src: "music/romantic/Maari 2 - Rowdy Baby (Video Song)  Dhanush, Sai Pallavi  Yuvan Shankar Raja  Balaji Mohan (Wunderbar Films).m4a" },
                { title: "Maruvaarthai", src: "music/romantic/Maruvaarthai (Sid Sriram).m4a" },
                { title: "Munbe Vaa", src: "music/romantic/Munbe Vaa (Naresh Iyer, Shreya Ghoshal).m4a" },
                { title: "Sirukki Vaasam", src: "music/romantic/Sirukki Vaasam Tamil Video  Dhanush, Trisha  Santhosh Narayanan (Anand Aravindakshan, Shweta Mohan, Vivek, Santhosh Narayanan).m4a" },
                { title: "Vaa Vaathi", src: "music/romantic/Vaa Vaathi (feat. Samyuktha Menon & Dhanush) (Video, Shweta Mohan, G.V. Prakash Kumar).m4a" },
                { title: "Vaarayo Vaarayo", src: "music/romantic/Vaarayo Vaarayo Video  Suriya, Nayanthara  Harris Jayaraj (Kabilan, Harris Jayaraj, P Unnikrishnan, Mega).m4a" },
                { title: "Yaayum", src: "music/romantic/Yaayum (From Sagaa) (Naresh Iyer, Rita Thyagarajan).m4a" }
            ],
            quotes: {
                ta: [
                    { text: "அன்பு இருக்கும் இடத்தில் உயிர் இருக்கிறது.", author: "மகாத்மா காந்தி" },
                    { text: "வாழ்க்கையில் பிடித்துக் கொள்ள வேண்டிய சிறந்த விஷயம் ஒருவருக்கொருவர்.", author: "ஆட்ரி ஹெப்பர்ன்" },
                    { text: "காதல் என்பது இரு உடல்களில் வாழும் ஒற்றை ஆன்மா.", author: "அரிஸ்டாட்டில்" },
                    { text: "உன்னை நேசிப்பது என் சுவாசம் போன்றது.", author: "தெரியவில்லை" },
                    { text: "தூய அன்பு காலத்தை வெல்லும்.", author: "தெரியவில்லை" },
                    { text: "உன் புன்னகையில் என் உலகம் இருக்கிறது.", author: "தெரியவில்லை" },
                    { text: "காதல் என்பது ஒரு அழகான கவிதை.", author: "தெரியவில்லை" },
                    { text: "உன்னுடன் இருக்கும் ஒவ்வொரு நொடியும் ஒரு பொற்காலம்.", author: "தெரியவில்லை" },
                    { text: "அன்பே சிவம், அன்பே வாழ்க்கை.", author: "தெரியவில்லை" },
                    { text: "நீ இல்லாமலே நான் இல்லை.", author: "தெரியவில்லை" },
                    { text: "நம் காதல் ஒரு காவியம்.", author: "தெரியவில்லை" },
                    { text: "இதயம் உன்னைத் தேடுகிறது.", author: "தெரியவில்லை" }
                ],
                en: [
                    { text: "Where there is love there is life.", author: "Mahatma Gandhi" },
                    { text: "The best thing to hold onto in life is each other.", author: "Audrey Hepburn" },
                    { text: "Love is composed of a single soul inhabiting two bodies.", author: "Aristotle" },
                    { text: "Loving you is like breathing.", author: "Unknown" },
                    { text: "Pure love conquers time.", author: "Unknown" },
                    { text: "My world is in your smile.", author: "Unknown" },
                    { text: "Love is a beautiful poem.", author: "Unknown" },
                    { text: "Every second with you is a golden age.", author: "Unknown" },
                    { text: "Love is life, and life is love.", author: "Unknown" },
                    { text: "I am nothing without you.", author: "Unknown" },
                    { text: "Our love is a legend.", author: "Unknown" },
                    { text: "My heart seeks you.", author: "Unknown" }
                ]
            },
            keywords: ['love', 'loving', 'romantic', 'romance', 'loved', 'in love', 'crush', 'heart', 'sweet', 'darling', 'honey', 'affection', 'affectionate', 'adore', 'adoration', 'infatuation', 'relationship', 'partner', 'girlfriend', 'boyfriend', 'date', 'dating', 'kiss', 'hug', 'miss you', 'missing', 'passionate', 'intimate', 'desire', 'charming', 'beautiful', 'cute', 'lovely', 'சுட்டி', 'காதல்', 'அன்பு', 'காதலி', 'காதலன்', 'நேசிக்கிறேன்', 'இதயம்']
        },
        energetic: {
            emoji: '😎',
            color: '#fb5607',
            wallpaper: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1600")',
            response: {
                ta: "தயாரா? 🤘 அதிரடியான பாடல்களுடன் ஆடத் தொடங்குவோம்!",
                en: "Ready to rock? 🤘 Let's blast some high-energy beats and move!"
            },
            songs: [
                { title: "Bombay Ponnu", src: "music/energetic/Bombay Ponnu (Song, Vijay Antony, Mamtha Sharma, M. L. R. Karthikeyan, and Senthil Dass).m4a" },
                { title: "En Jannal Vandha", src: "music/energetic/En Jannal Vandha (Yuvan Shankar Raja, Roshini, Priya Hemesh, Divya Vijay).m4a" },
                { title: "Kalasala Kalasala", src: "music/energetic/Kalasala Kalasala (Song, SS Thaman, L.R. Eswari, T. Rajendar, Solar Sai).m4a" },
                { title: "Mascara", src: "music/energetic/Mascara (Supriya Joshi, Vijay Antony).m4a" },
                { title: "Monica", src: "music/energetic/Monica (From Coolie) (Tamil) (Sublahshini, Vishnu Edavan).m4a" },
                { title: "Mukkala Mukkabla", src: "music/energetic/Mukkala Mukkabla (Mano, Swarnalatha).m4a" },
                { title: "Uchimandai", src: "music/energetic/Uchimandai (Vijay Antony, Krishna Iyer, Shoba Chandrasekhar, Charulatha Mani, Shakthisree Gopalan, and Annamalai).m4a" },
                { title: "Ussumu Laresey", src: "music/energetic/Ussumu Laresey (Vijay Antony, Emcee Jazz, Janaki Iyer).m4a" },
                { title: "Yaakkai Thiri", src: "music/energetic/Yaakkai Thiri (A.R. Rahman, Sunitha Sarathy, Shalini Singh, Vairamuthu).m4a" },
                { title: "Yellae Lama", src: "music/energetic/Yellae Lama (Harris Jayaraj).m4a" }
            ],
            quotes: {
                ta: [
                    { text: "ஆற்றலும் விடாமுயற்சியும் எல்லாவற்றையும் வெல்லும்.", author: "பெஞ்சமின் பிராங்க்ளின்" },
                    { text: "நீங்கள் செய்வதை விரும்புவதே சிறந்த வேலையைச் செய்வதற்கான ஒரே வழி.", author: "ஸ்டீவ் ஜாப்ஸ்" },
                    { text: "கடின உழைப்புக்கு மாற்று ஏதுமில்லை.", author: "தொமஸ் எடிசன்" },
                    { text: "இன்றே செய், நன்றே செய்.", author: "பழமொழி" },
                    { text: "உன் இலக்கை அடையும் வரை ஓயாதே.", author: "விவேகானந்தர்" },
                    { text: "துணிச்சலே வெற்றியின் முதல் படி.", author: "தெரியவில்லை" },
                    { text: "வேகம் விவேகம் வெற்றியின் ரகசியம்.", author: "தெரியவில்லை" },
                    { text: "உன்னால் முடியும் நண்பா!", author: "தெரியவில்லை" },
                    { text: "எப்போதும் உற்சாகமாக இருங்கள்.", author: "தெரியவில்லை" },
                    { text: "தடைகளை உடைத்து எறி.", author: "தெரியவில்லை" },
                    { text: "வெற்றி நமதே!", author: "தெரியவில்லை" },
                    { text: "புதிய சிகரங்களை எட்டுங்கள்.", author: "தெரியவில்லை" }
                ],
                en: [
                    { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
                    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
                    { text: "There is no substitute for hard work.", author: "Thomas Edison" },
                    { text: "Do it now, do it well.", author: "Proverb" },
                    { text: "Stop not until the goal is reached.", author: "Swami Vivekananda" },
                    { text: "Courage is the first step to success.", author: "Unknown" },
                    { text: "Speed and wisdom are secrets of success.", author: "Unknown" },
                    { text: "You can do it, my friend!", author: "Unknown" },
                    { text: "Always stay energetic.", author: "Unknown" },
                    { text: "Break through the obstacles.", author: "Unknown" },
                    { text: "Victory is ours!", author: "Unknown" },
                    { text: "Reach new heights.", author: "Unknown" }
                ]
            },
            keywords: ['energetic', 'energy', 'pumped', 'pump', 'active', 'hyped', 'hype', 'power', 'powerful', 'strong', 'strength', 'fired up', 'amped', 'dynamic', 'lively', 'vigorous', 'vibrant', 'unstoppable', 'beast', 'turbo', 'dance', 'dancing', 'party', 'fun', 'wired', 'buzzing', 'on fire', 'ready', 'rocking', 'উৎসাহী', 'உற்சாகம்', 'வேகம்', 'ஆடத் தயார்', 'பரபரப்பு', 'துடிப்பு']
        },
        relaxed: {
            emoji: '😌',
            color: '#06d6a0',
            wallpaper: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1600")',
            response: {
                ta: "ஆழ்ந்த மூச்சு விடுங்கள். எல்லாம் அமைதியாக இருக்கிறது.",
                en: "Take a deep breath. Everything is calm. Enjoy this peaceful moment."
            },
            songs: [
                { title: "Alaipayuthey", src: "music/relaxed/Alaipayuthey (Song, Kavya Ajit, Precious Peter).m4a" },
                { title: "Asku Laska", src: "music/relaxed/Asku Laska Audio Song   Nanban (Video, Gemini Audio).m4a" },
                { title: "Don'u Don'u Don'u", src: "music/relaxed/Don'u Don'u Don'u (The Don's Romance) (Anirudh Ravichander, Alisha Thomas, Dhanush).m4a" },
                { title: "Enakke Enakkaa", src: "music/relaxed/Enakke  Enakkaa (Unnikrishnan).m4a" },
                { title: "Kadal Raasa Naan", src: "music/relaxed/Kadal Raasa Naan (A.R. Rahman, Yuvan Shankar Raja).m4a" },
                { title: "Marudaani", src: "music/relaxed/Marudaani (Rendition) (Sanah Moidutty).m4a" },
                { title: "Moongil Thottam", src: "music/relaxed/Moongil Thottam (A.R. Rahman, Abhay Jodhpurkar, Harini, Vairamuthu).m4a" },
                { title: "Poovukkul", src: "music/relaxed/Poovukkul (Unnikrishnan & Sujatha).m4a" },
                { title: "Unakkul Naane", src: "music/relaxed/Unakkul Naane (Harris Jeyaraj, Bombay Jayashri, Rohini).m4a" },
                { title: "Vaseegara", src: "music/relaxed/Vaseegara (Bombay Jayashri).m4a" }
            ],
            quotes: {
                ta: [
                    { text: "அமைதி என்பது வாழ்க்கையின் அழகு.", author: "மெனசெம் மெக்கின்" },
                    { text: "உங்களுக்குள் ஒரு அமைதியும் புகலிடமும் இருக்கிறது.", author: "ஹெர்மன் ஹெஸ்ஸே" },
                    { text: "அமைதியே பேரானந்தம்.", author: "ரமண மகரிஷி" },
                    { text: "மனம் அமைதியாக இருந்தால் வாழ்க்கை அழகாகும்.", author: "தெரியவில்லை" },
                    { text: "இன்று அமைதியாக இருப்போம்.", author: "தெரியவில்லை" },
                    { text: "இயற்கையோடு இணைந்து வாழோம்.", author: "தெரியவில்லை" },
                    { text: "மென்மையான காற்றே எனக்குத் துணை.", author: "தெரியவில்லை" },
                    { text: "நிதானமே பிரதானம்.", author: "தெரியவில்லை" },
                    { text: "எல்லாம் நன்மையில் முடியும்.", author: "தெரியவில்லை" },
                    { text: "அமைதியான கடலைப் போல் இருங்கள்.", author: "தெரியவில்லை" },
                    { text: "மகிழ்ச்சியான உறக்கம்.", author: "தெரியவில்லை" },
                    { text: "பிரார்த்தனை அமைதியைத் தரும்.", author: "தெரியவில்லை" }
                ],
                en: [
                    { text: "Peace is the beauty of life. It is sunshine. It is the smile of a child.", author: "Menachem Begin" },
                    { text: "Within you, there is a stillness and a sanctuary to which you can retreat at any time.", author: "Hermann Hesse" },
                    { text: "Peace is its own reward.", author: "Ramana Maharshi" },
                    { text: "Life is beautiful when the mind is at peace.", author: "Unknown" },
                    { text: "Let's be calm today.", author: "Unknown" },
                    { text: "Live in harmony with nature.", author: "Unknown" },
                    { text: "The gentle breeze is my companion.", author: "Unknown" },
                    { text: "Patience is key.", author: "Unknown" },
                    { text: "Everything will end in good.", author: "Unknown" },
                    { text: "Be like a calm sea.", author: "Unknown" },
                    { text: "Have a peaceful sleep.", author: "Unknown" },
                    { text: "Prayer brings peace.", author: "Unknown" }
                ]
            },
            keywords: ['relaxed', 'relaxing', 'calm', 'calmness', 'peaceful', 'peace', 'chill', 'chilled', 'chilling', 'quiet', 'rested', 'rest', 'lazy', 'laid back', 'mellow', 'serene', 'tranquil', 'soothing', 'gentle', 'easy', 'comfortable', 'cozy', 'cosy', 'zen', 'still', 'stress free', 'no stress', 'unbothered', 'at ease', 'tension free', 'அமைதி', 'நிதானம்', 'சாந்தம்', 'ரிலாக்ஸ்', 'நிம்மதி', 'பயமில்லை']
        },
        angry: {
            emoji: '😠',
            color: '#e63946',
            wallpaper: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&q=80&w=1600")',
            response: {
                ta: "நெருப்பை என்னால் உணர முடிகிறது! 🔥 கோபத்தை வெளிப்படுத்துங்கள், பிறகு அமைதியைத் தேடுவோம்.",
                en: "I can feel the fire! 🔥 Let it out, then we'll find some peace together."
            },
            songs: [
                { title: "Arasan Theme", src: "music/angry/Arasan Theme (Anirudh Ravichander).m4a" },
                { title: "Be Notorious", src: "music/angry/Be Notorious (End Credit Version) (From Bheeshma Parvam) (Song, Sushin Shyam, Mammootty, Soubin Shahir, Hamsika Iyer).m4a" },
                { title: "Dahaa Theme", src: "music/angry/Dahaa Theme (From Coolie) (Anirudh Ravichander, Heisenberg, Lalo Salamanca).m4a" },
                { title: "Firestorm", src: "music/angry/Firestorm (From They Call Him OG) (Thaman S, STR, Raja Kumari, Deepak Blue).m4a" },
                { title: "Jagadish On Mission", src: "music/angry/Jagadish On Mission (Instrumental).m4a" },
                { title: "Karuppu Vellai", src: "music/angry/Karuppu Vellai (Song, Sivam, Sam C.S.).m4a" },
                { title: "Lokiverse", src: "music/angry/Lokiverse (Background Score) (Song, Anirudh Ravichander).m4a" },
                { title: "Manavaalan Thug", src: "music/angry/Manavaalan Thug - From Thallumaala (Song, Dabzee & SA).m4a" },
                { title: "Red Sea", src: "music/angry/Red Sea (From Devara Part 1) (Anirudh Ravichander).m4a" },
                { title: "Theemai Dhaan Vellum", src: "music/angry/Theemai Dhaan Vellum (Awakening the Monster) (Song, Hiphop Tamizha, Arvind Swamy).m4a" }
            ],
            quotes: {
                ta: [
                    { text: "கோபப்படும் ஒவ்வொரு நிமிடமும் நீங்கள் அறுபது வினாடி மன அமைதியை இழக்கிறீர்கள்.", author: "ரால்ப் வால்டோ எமர்சன்" },
                    { text: "கோபம் உங்களைத் தோற்கடிக்கிறது.", author: "எலிசபெத் கென்னி" },
                    { text: "கோபத்தை அடக்குபவனே வீரன்.", author: "நபிமொழிகள்" },
                    { text: "ஆத்திரக்காரனுக்கு புத்தி மட்டு.", author: "பழமொழி" },
                    { text: "பொறுமை கடலினும் பெரியது.", author: "பழமொழி" },
                    { text: "கோபம் ஒரு தற்காலிக பைத்தியம்.", author: "ஹோரஸ்" },
                    { text: "வார்த்தைகளைக் கொட்டும் முன் யோசியுங்கள்.", author: "தெரியவில்லை" },
                    { text: "கோபம் உங்களை மட்டும் அல்ல, மற்றவர்களையும் எரிக்கும்.", author: "தெரியவில்லை" },
                    { text: "அமைதியால் கோபத்தை வெல்லுங்கள்.", author: "புத்தர்" },
                    { text: "மன்னிப்பு கோபத்தை போக்கும் மருந்து.", author: "தெரியவில்லை" },
                    { text: "வெறுப்பை விட அன்பே மேலானது.", author: "தெரியவில்லை" },
                    { text: "நிதானமாகச் சிந்திப்போம்.", author: "தெரியவில்லை" }
                ],
                en: [
                    { text: "For every minute you remain angry, you give up sixty seconds of peace of mind.", author: "Ralph Waldo Emerson" },
                    { text: "He who angers you conquers you.", author: "Elizabeth Kenny" },
                    { text: "The strong man is not the good wrestler; the strong man is only the one who controls himself when he is angry.", author: "Prophet Muhammad" },
                    { text: "Anger is a short madness.", author: "Horace" },
                    { text: "Patience is bitter, but its fruit is sweet.", author: "Jean-Jacques Rousseau" },
                    { text: "Speak when you are angry and you will make the best speech you will ever regret.", author: "Ambrose Bierce" },
                    { text: "Think before you speak.", author: "Unknown" },
                    { text: "Anger burns you more than others.", author: "Unknown" },
                    { text: "Conquer anger with peace.", author: "Buddha" },
                    { text: "Forgiveness is the best medicine for anger.", author: "Unknown" },
                    { text: "Love is better than hate.", author: "Unknown" },
                    { text: "Let's think calmly.", author: "Unknown" }
                ]
            },
            keywords: ['angry', 'anger', 'mad', 'furious', 'fury', 'annoyed', 'annoy', 'pissed', 'hate', 'hatred', 'rage', 'raging', 'livid', 'frustrated', 'frustration', 'irritated', 'irritation', 'agitated', 'outraged', 'offended', 'bitter', 'resentful', 'hostile', 'aggressive', 'violent', 'explosive', 'boiling', 'fed up', 'done with', 'sick of', 'enough', 'unfair', 'ridiculous', 'கோபம்', 'எரிச்சல்', 'கோபமாக', 'கோபப்படுகிறேன்', 'ஆத்திரம்', 'இடி']
        },
        alone: {
            emoji: '👤',
            color: '#94a3b8',
            wallpaper: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url("https://images.unsplash.com/photo-1494500764479-0c8f2919a3d8?auto=format&fit=crop&q=80&w=1600")',
            response: {
                ta: "தனிமை என்பது சில நேரங்களில் அமைதியைத் தரும். உங்களுடன் நான் இருக்கிறேன். 🌌",
                en: "Solitude can be peaceful sometimes. I'm here for you, always. 🌌"
            },
            songs: [
                { title: "Anbe En Anbe", src: "music/Alone/Anbe En Anbe (Song, Harris Jayaraj, Harish Raghavendra, Na.Muthukumar).m4a" },
                { title: "Chekuthan", src: "music/Alone/Chekuthan (Reprise) (Ribin Richard, Nihal Sadiq).m4a" },
                { title: "En Iniya Thanimaye", src: "music/Alone/En Iniya Thanimaye (From Teddy) (Song, Sid Sriram, D. Imman).m4a" },
                { title: "Irava Pagala", src: "music/Alone/Irava Pagala (Song, Hariharan, Sujatha Mohan).m4a" },
                { title: "Nenjukkule", src: "music/Alone/Nenjukkule (A.R. Rahman, Shakthisree Gopalan, Vairamuthu).m4a" },
                { title: "New York Nagaram", src: "music/Alone/New York Nagaram (A.R.Rahman).m4a" },
                { title: "Oru Manam", src: "music/Alone/Oru Manam (From Dhruva Natchathiram) (Karthik, Shashaa Tirupati).m4a" },
                { title: "Poi Vazhva", src: "music/Alone/Poi Vazhva (Santhosh Narayanan, Vijaynarain, & Vivek).m4a" },
                { title: "The Life of Ram", src: "music/Alone/The Life of Ram (Govind Vasantha, Pradeep Kumar).m4a" },
                { title: "Yaaro Manathile", src: "music/Alone/Yaaro Manathile (Song, Harris Jayaraj, Bombay Jayashri, Krish).m4a" }
            ],
            quotes: {
                ta: [
                    { text: "தனிமை என்பது நீங்கள் சந்திக்கும் உன்னதமான நிறுவனம்.", author: "ஹென்றி டேவிட் தோரோ" },
                    { text: "தனிமை உங்களை வளர்க்கும்.", author: "பெர்னார்ட் ஷா" },
                    { text: "உங்களோடு நீங்கள் இருக்கத் பழகுங்கள்.", author: "தெரியவில்லை" },
                    { text: "தனிமை ஒரு சுகமான அனுபவம்.", author: "தெரியவில்லை" },
                    { text: "தன்னிறைவு பெற்ற வாழ்வு.", author: "தெரியவில்லை" },
                    { text: "மனதோடு பேசுங்கள்.", author: "தெரியவில்லை" },
                    { text: "தனிமை உங்களை நீங்களே கண்டறிய உதவும்.", author: "தெரியவில்லை" },
                    { text: "நான் எனக்காக இருக்கிறேன்.", author: "தெரியவில்லை" },
                    { text: "அமைதியான தனிமை.", author: "தெரியவில்லை" },
                    { text: "தனிமையிலும் இனிமை காணலாம்.", author: "தெரியவில்லை" },
                    { text: "ஆன்மாவோடு உரையாடுங்கள்.", author: "தெரியவில்லை" },
                    { text: "தனிமை என்பது பலவீனம் அல்ல, அது வலிமை.", author: "தெரியவில்லை" }
                ],
                en: [
                    { text: "I never found a companion that was so companionable as solitude.", author: "Henry David Thoreau" },
                    { text: "Solitude is the place of purification.", author: "Martin Buber" },
                    { text: "Learn to be alone and to like it.", author: "Unknown" },
                    { text: "Solitude is a sweet experience.", author: "Unknown" },
                    { text: "A self-sufficient life.", author: "Unknown" },
                    { text: "Talk to your mind.", author: "Unknown" },
                    { text: "Solitude helps you find yourself.", author: "Unknown" },
                    { text: "I am there for myself.", author: "Unknown" },
                    { text: "Peaceful solitude.", author: "Unknown" },
                    { text: "Find sweetness in solitude.", author: "Unknown" },
                    { text: "Dialogue with the soul.", author: "Unknown" },
                    { text: "Solitude is not weakness, it's strength.", author: "Unknown" }
                ]
            },
            keywords: ['alone', 'solitude', 'lonely', 'loneliness', 'single', 'independent', 'isolated', 'isolation', 'withdrawn', 'secluded', 'introvert', 'antisocial', 'quiet time', 'me time', 'no one', 'nobody', 'by myself', 'on my own', 'left out', 'excluded', 'invisible', 'forgotten', 'ignored', 'missing company', 'disconnected', 'தனிமை', 'தனியாக', 'ஒருவரும் இல்லை', 'தனிமையாக', 'யாரும் இல்லை']
        },
        motivation: {
            emoji: '🔥',
            color: '#ff4d00',
            wallpaper: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&q=80&w=1600")',
            response: {
                ta: "வெற்றி உங்கள் கைக்குள்! 💪 இதோ உங்களுக்கான உத்வேகம்!",
                en: "Success is within your reach! 💪 Let's fuel that fire within!"
            },
            songs: [
                { title: "Dheera Dheera", src: "music/Motivation/Dheera Dheera Full Video Song  KGF Tamil Movie  Yash  Prashanth Neel  Hombale Films Ravi Basrur (Lahari Music).m4a" },
                { title: "Ella Pugazhum", src: "music/Motivation/Ella Pugazhum (Song, A.R.Rahman).m4a" },
                { title: "Fear Song", src: "music/Motivation/Fear Song (Anirudh Ravichander).m4a" },
                { title: "Hey Mama", src: "music/Motivation/Hey Mama (From Sethupathi) (Anirudh Ravichander).m4a" },
                { title: "Kayilae Aagasam", src: "music/Motivation/Kayilae Aagasam (From Soorarai Pottru) (Song, Saindhavi).m4a" },
                { title: "Mun Sellada", src: "music/Motivation/Mun Sellada (Song, Santhosh Narayanan, Anirudh Ravichander, ADK, and Madhan Karky).m4a" },
                { title: "Pala Pala", src: "music/Motivation/Pala Pala (Song, Hariharan).m4a" },
                { title: "Porkanda Singam", src: "music/Motivation/Porkanda Singam EDM Version (Additional Song) (Anirudh Ravichander, Vishnu Edavan).m4a" },
                { title: "Trance of OMI", src: "music/Motivation/Trance of OMI (Sruthi Ranjani, Adviteeya Vojjala, Sruthika).m4a" },
                { title: "Unstoppable", src: "music/Motivation/Unstoppable (Song, Sia).m4a" }
            ],
            quotes: {
                ta: [
                    { text: "எதிர்காலத்தைக் கணிக்க சிறந்த வழி அதை உருவாக்குவதே.", author: "பீட்டர் டிரக்கர்" },
                    { text: "வெற்றி என்பது இறுதி அல்ல, தோல்வி என்பது மரணம் அல்ல: தொடரக்கூடிய தைரியமே முக்கியம்.", author: "வின்ஸ்டன் சர்ச்சில்" },
                    { text: "முயற்சி திருவினையாக்கும்.", author: "திருவள்ளுவர்" },
                    { text: "உன்னால் முடியும் தம்பி!", author: "தெரியவில்லை" },
                    { text: "தோல்வியே வெற்றியின் முதல் படி.", author: "பழமொழி" },
                    { text: "விதைத்துக் கொண்டே இரு, ஒருநாள் அறுவடை செய்வாய்.", author: "தெரியவில்லை" },
                    { text: "வெற்றி உனக்காகக் காத்திருக்கிறது.", author: "தெரியவில்லை" },
                    { text: "எப்போதும் முன்னேறுங்கள்.", author: "தெரியவில்லை" },
                    { text: "உன் கனவுகளைப் பின்தொடர்.", author: "தெரியவில்லை" },
                    { text: "நம்பிக்கையே உத்வேகம்.", author: "தெரியவில்லை" },
                    { text: "கடின உழைப்பு என்றும் வீண் போகாது.", author: "தெரியவில்லை" },
                    { text: "நீ ஒரு சாதனையாளன்.", author: "தெரியவில்லை" }
                ],
                en: [
                    { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
                    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
                    { text: "Effort will yield rewards.", author: "Thiruvalluvar" },
                    { text: "You can do it!", author: "Unknown" },
                    { text: "Failure is the stepping stone to success.", author: "Proverb" },
                    { text: "Keep sowing, one day you will reap.", author: "Unknown" },
                    { text: "Success is waiting for you.", author: "Unknown" },
                    { text: "Always move forward.", author: "Unknown" },
                    { text: "Follow your dreams.", author: "Unknown" },
                    { text: "Belief is inspiration.", author: "Unknown" },
                    { text: "Hard work never goes to waste.", author: "Unknown" },
                    { text: "You are an achiever.", author: "Unknown" }
                ]
            },
            keywords: ['motivation', 'motivated', 'motivate', 'inspire', 'inspired', 'inspiration', 'focus', 'focused', 'work', 'working', 'success', 'successful', 'achieve', 'achievement', 'goal', 'goals', 'target', 'ambition', 'ambitious', 'hustle', 'grind', 'push', 'drive', 'determined', 'determination', 'productive', 'productivity', 'discipline', 'consistent', 'warrior', 'champion', 'conquer', 'dream', 'dreaming', 'vision', 'உத்வேகம்', 'வெற்றி', 'கடின உழைப்பு', 'இலக்கு', 'வெற்றிடம்', 'முன்னேற்றம்']
        },
        devotional: {
            emoji: '🙏',
            color: '#f59e0b',
            wallpaper: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("https://images.unsplash.com/photo-1542352135-4340330058e5?auto=format&fit=crop&q=80&w=1600")',
            response: {
                ta: "அமைதி மற்றும் பக்தி உணர்விற்காக சில பாடல்களை ஒலிக்கச் செய்கிறேன். உள்ளம் அமைதி பெறட்டும்.",
                en: "Let me play some peaceful devotional songs for you. May your soul find peace."
            },
            songs: [
                { title: "Arunaiyin Perumagane", src: "music/devotional/Arunaiyin Perumagane lord shiva song for positiveness and you will get inner peace with LYRICS1080p (Video, Aishwarya S).m4a" },
                { title: "Iraivanidam Kaiyendungal", src: "music/devotional/Iraivanidam Kaiyendungal (Song, Isaimurasu Nagore E M Haniffa, M Muthu, & R Abdul Salam).m4a" },
                { title: "Neeye Nirantharam", src: "music/devotional/Neeye Nirantharam (Song, Swarnalatha).m4a" },
                { title: "Onbathu Kolum", src: "music/devotional/Onbathu Kolum (Song, T.L.Maharajan).m4a" },
                { title: "Oru Naal Madeena", src: "music/devotional/Oru Naal Madeena (Song, Haji Nagore E. M. Hanifa).m4a" },
                { title: "Sokkanathan Petredutha Pillayar", src: "music/devotional/Sokkanathan Petredutha Pillayar HD Songs சொக்கநாதர் பெற்று எடுத்த பிள்ளையாரம் sri Kavarpanai Masanam (Video, Ayyapan beatz).m4a" },
                { title: "Ullam Uruguthaiya", src: "music/devotional/Ullam Uruguthaiya (T. M. Soundararajan).m4a" },
                { title: "Kanda Sashti Kavacham", src: "music/devotional/கந்த சஷ்டி கவசம் - பாராயண பாடல் வரிகள்  Kanda Sashti Kavacham with Lyrics Tamil  Vijay Musicals (Video, Trivendram Sisters  Latha  Malathi).m4a" },
                { title: "Karunai Um Vadivallava", src: "music/devotional/கருணை உம் வடிவல்லவா  KARUNAI UM  சகோ.S. P. Balasubrahmanyam  Tamil Christian Songs (Holy Christian Music).m4a" },
                { title: "Hara Hara Sivanae", src: "music/devotional/ஹர ஹர சிவனே பாடல்  Hara hara sivanae Song  subamAudioVision #shivansongs #devotionalsong #spbsongs (Video, Subam Audio Vision).m4a" }
            ],
            quotes: {
                ta: [
                    { text: "கடவுள் மீதான நம்பிக்கை நம்மை வழிநடத்தும்.", author: "தெரியவில்லை" },
                    { text: "உள்ளம் உருகுவதே உண்மையான பக்தி.", author: "தெரியவில்லை" },
                    { text: "அன்பே சிவம், பக்தி அமைதியைத் தரும்.", author: "தெரியவில்லை" },
                    { text: "எல்லா உயிர்களிடத்தும் அன்பு காட்டுங்கள்.", author: "தெரியவில்லை" },
                    { text: "தியானம் மனத் தெளிவைத் தரும்.", author: "தெரியவில்லை" }
                ],
                en: [
                    { text: "Faith in God will guide us through.", author: "Unknown" },
                    { text: "Real devotion is the melting of the heart.", author: "Unknown" },
                    { text: "Love is God, and devotion brings peace.", author: "Unknown" },
                    { text: "Show love to all living beings.", author: "Unknown" },
                    { text: "Meditation brings clarity to the mind.", author: "Unknown" }
                ]
            },
            keywords: ['devotional', 'devotion', 'god', 'prayer', 'pray', 'praying', 'spiritual', 'spirituality', 'temple', 'church', 'mosque', 'faith', 'religious', 'religion', 'worship', 'bless', 'blessed', 'divine', 'meditation', 'meditate', 'mantra', 'yoga', 'peaceful prayer', 'holy', 'sacred', 'grace', 'பக்தி', 'கடவுள்', 'பிரார்த்தனை', 'கோவில்', 'வணக்கம்', 'ஆண்டவன்', 'தியானம்', 'இறை', 'சிவம்', 'முருகன்']
        }
    };

    // Situation Video Assets
    const situationVideos = {
        happy: ["Your situation/Happy/happy.mp4"],
        sad: ["Your situation/Sad/sad.mp4"],
        romantic: ["Your situation/Romantic/Oru poiyavathu sol kanne.mp4"],
        energetic: ["Your situation/Energetic/Energetic.mp4"],
        relaxed: ["Your situation/Relaxed/Relax.mp4"],
        angry: ["Your situation/Angry/angry.mp4"],
        alone: ["Your situation/Alone/alone.mp4"],
        motivation: ["Your situation/Motivation/Motivation.mp4"],
        devotional: ["Your situation/devotional/Devotional.mp4"]
    };

    // State Management (Handled at the top)

    // Initialize Page
    if (currentLang) {
        setLanguage(currentLang);
    }
    if (currentMood && moods[currentMood]) {
        applyMood(currentMood, false);
    }

    // Particle System
    function createParticles() {
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            // Random styling
            const size = Math.random() * 6 + 2;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${Math.random() * 100}vw`;
            particle.style.top = `${Math.random() * 100}vh`;
            particle.style.animationDelay = `${Math.random() * 10}s`;
            particle.style.animationDuration = `${Math.random() * 10 + 10}s`;

            particlesContainer.appendChild(particle);
        }
    }

    createParticles();

    // Event Listeners
    moodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const mood = btn.getAttribute('data-mood');
            applyMood(mood);
        });
    });

    moodTextInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const val = moodTextInput.value;
            moodTextInput.value = '';
            await detectMoodFromText(val);
        }
    });

    voiceInputBtn.addEventListener('click', () => {
        startVoiceRecognition();
    });

    playPauseBtn.addEventListener('click', () => {
        togglePlayPause();
    });

    prevBtn.addEventListener('click', () => {
        playPreviousSong();
    });

    nextBtn.addEventListener('click', () => {
        playNextSong();
    });

    langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            setLanguage(lang);
        });
    });

    discoveryBtn.addEventListener('click', () => {
        if (!isDiscoveryMode) {
            startMoodDiscovery();
        } else {
            endMoodDiscovery();
        }
    });

    situationBtn.addEventListener('click', () => {
        playSituationVideo();
    });

    closeModalBtn.addEventListener('click', () => {
        closeVideoModal();
    });

    videoPrevBtn.addEventListener('click', () => {
        playPreviousVideo();
    });

    videoPlayPauseBtn.addEventListener('click', () => {
        toggleVideoPlayPause();
    });

    videoNextBtn.addEventListener('click', () => {
        playNextVideo();
    });

    // Close modal on click outside content
    videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal) {
            closeVideoModal();
        }
    });

    function playSituationVideo(startIndex = -1) {
        if (!currentMood || !situationVideos[currentMood]) return;

        // Immediately silence AI
        synth.cancel();

        const videos = situationVideos[currentMood];
        currentSituationPlaylist = videos;

        if (startIndex === -1) {
            currentSituationIndex = Math.floor(Math.random() * videos.length);
        } else {
            currentSituationIndex = startIndex;
        }

        const videoSrc = currentSituationPlaylist[currentSituationIndex];

        situationVideo.src = videoSrc;
        videoModal.classList.add('active');

        // Pause background music if playing
        if (!audioPlayer.paused) {
            audioPlayer.pause();
            playPauseBtn.textContent = '▶️';
            playerBar.classList.add('paused');
        }

        situationVideo.play()
            .then(() => {
                videoPlayPauseBtn.textContent = '⏸️';
            })
            .catch(err => console.error("Video play error:", err));

        // Disable automatic next-play to prevent "annoying" repetition
        situationVideo.onended = () => {
            videoPlayPauseBtn.textContent = '▶️';
            console.log("Video session ended.");
        };
    }

    function toggleVideoPlayPause() {
        if (situationVideo.paused) {
            situationVideo.play();
            videoPlayPauseBtn.textContent = '⏸️';
        } else {
            situationVideo.pause();
            videoPlayPauseBtn.textContent = '▶️';
        }
    }

    function playNextVideo() {
        if (currentSituationPlaylist.length === 0) return;
        currentSituationIndex = (currentSituationIndex + 1) % currentSituationPlaylist.length;
        situationVideo.src = currentSituationPlaylist[currentSituationIndex];
        situationVideo.play();
        videoPlayPauseBtn.textContent = '⏸️';
    }

    function playPreviousVideo() {
        if (currentSituationPlaylist.length === 0) return;
        currentSituationIndex = (currentSituationIndex - 1 + currentSituationPlaylist.length) % currentSituationPlaylist.length;
        situationVideo.src = currentSituationPlaylist[currentSituationIndex];
        situationVideo.play();
        videoPlayPauseBtn.textContent = '⏸️';
    }

    function closeVideoModal() {
        videoModal.classList.remove('active');
        situationVideo.pause();
        situationVideo.currentTime = 0;
        situationVideo.src = ""; // Clear src to stop loading

        // Trigger pending mood response if any
        if (pendingMoodAction) {
            pendingMoodAction();
            pendingMoodAction = null;
        }
    }

    function startMoodDiscovery() {
        isDiscoveryMode = true;
        discoveryStep = 0;
        discoveryResponses = [];
        discoveryBtn.classList.add('active');

        const stopBtnText = currentLang === 'ta' ? "அமைர்வை நிறுத்து" : "Stop Session";
        discoveryBtn.innerHTML = `<span class="sparkle">❌</span> ${stopBtnText}`;

        const firstQuestion = discoveryQuestions[currentLang][0].q;
        typeWriter(aiResponse, firstQuestion);
        speak(firstQuestion);
        renderDiscoveryOptions(0);
    }

    function endMoodDiscovery() {
        isDiscoveryMode = false;
        discoveryBtn.classList.remove('active');

        const startBtnText = currentLang === 'ta' ? "என்னுடன் உங்கள் மனநிலையைக் கண்டறியவும்" : "Find Your Mood with Me";
        discoveryBtn.innerHTML = `<span class="sparkle">✨</span> ${startBtnText}`;

        discoveryOptionsGrid.classList.remove('active');
        typeWriter(aiResponse, currentLang === 'ta' ? "சரி, நாம் மீண்டும் எப்போது வேண்டுமானாலும் தொடரலாம்!" : "Alright, we can continue anytime!");
    }

    function renderDiscoveryOptions(step) {
        discoveryOptionsGrid.innerHTML = '';
        const options = discoveryQuestions[currentLang][step].options;

        options.forEach((opt, index) => {
            const letter = String.fromCharCode(65 + index); // A, B, C...
            const btn = document.createElement('button');
            btn.className = 'option-item';
            btn.innerHTML = `<span class="option-letter">${letter}</span> ${opt}`;
            btn.addEventListener('click', () => handleDiscoveryResponse(opt));
            discoveryOptionsGrid.appendChild(btn);
        });

        discoveryOptionsGrid.classList.add('active');
    }

    async function handleDiscoveryResponse(text) {
        discoveryOptionsGrid.classList.remove('active');
        discoveryResponses.push(text);
        discoveryStep++;

        if (discoveryStep < discoveryQuestions[currentLang].length) {
            const nextQuestion = discoveryQuestions[currentLang][discoveryStep].q;
            setTimeout(() => {
                typeWriter(aiResponse, nextQuestion);
                speak(nextQuestion);
                renderDiscoveryOptions(discoveryStep);
            }, 500);
        } else {
            typeWriter(aiResponse, currentLang === 'ta' ? "உங்களை நன்கு புரிந்துகொண்டேன்... உங்கள் மனநிலையைக் கணிக்கிறேன்..." : "I understand you better now... Analyzing your mood...");
            aiLogo.classList.add('active');
            await analyzeMoodFromSession();
        }
    }

    async function analyzeMoodFromSession() {
        // Primary: use smart heuristic on the option-index mood map (reliable, instant)
        const heuristicKey = heuristicMoodDetection();
        console.log("Heuristic detected mood:", heuristicKey);

        // Build context string for optional API call (fix \n escape bug)
        const sessionContext = discoveryResponses.map((resp, i) => `Q: ${discoveryQuestions[currentLang][i].q} A: ${resp}`).join('\n');
        console.log("Analyzing Session Context:", sessionContext);

        try {
            const systemPrompt = `You are an emotional analyst. Based on the user's answers, identify their mood. Choose EXACTLY ONE from this list: [happy, sad, romantic, energetic, relaxed, angry, alone, motivation, devotional]. Respond with ONLY the lowercase word, nothing else.`;

            const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inputs: `<s>[INST] ${systemPrompt}\n\nSession Context:\n${sessionContext} [/INST] Mood Key:`,
                    parameters: { max_new_tokens: 15, temperature: 0.1 }
                })
            });

            if (!response.ok) throw new Error('API Error');
            const result = await response.json();
            console.log("AI Raw Result:", result);

            let detectedText = '';
            if (Array.isArray(result) && result[0]?.generated_text) {
                detectedText = result[0].generated_text.toLowerCase();
            } else if (result.generated_text) {
                detectedText = result.generated_text.toLowerCase();
            }

            console.log("Extracted Text:", detectedText);

            // Robust matching — prefer heuristic if AI returns nothing valid
            const validKeys = ['happy', 'sad', 'romantic', 'energetic', 'relaxed', 'angry', 'alone', 'motivation', 'devotional'];
            // Only use words from the last part (after [/INST] prompt) to avoid re-matching prompt text
            const afterInst = detectedText.split('[/inst]').pop() || detectedText;
            let detectedKey = validKeys.find(key => afterInst.includes(key));

            if (!detectedKey) {
                console.log("AI did not provide a valid key. Using heuristic result.");
                detectedKey = heuristicKey;
            }

            console.log("Final Detected Mood:", detectedKey);
            _applyDiscoveryResult(detectedKey);

        } catch (error) {
            console.error("Mood analysis failed (using heuristic):", error);
            _applyDiscoveryResult(heuristicKey);
        }
    }

    function _applyDiscoveryResult(detectedKey) {
        setTimeout(() => {
            aiLogo.classList.remove('active');
            applyMood(detectedKey);
            isDiscoveryMode = false;
            discoveryBtn.classList.remove('active');

            const startBtnText = currentLang === 'ta' ? "என்னுடன் உங்கள் மனநிலையைக் கண்டறியவும்" : "Find Your Mood with Me";
            discoveryBtn.innerHTML = `<span class="sparkle">✨</span> ${startBtnText}`;

            discoveryOptionsGrid.classList.remove('active');

            const moodLabels = {
                happy: currentLang === 'ta' ? 'மகிழ்ச்சி' : 'happy',
                sad: currentLang === 'ta' ? 'சோகம்' : 'sad',
                romantic: currentLang === 'ta' ? 'காதல்' : 'romantic',
                energetic: currentLang === 'ta' ? 'உற்சாகம்' : 'energetic',
                relaxed: currentLang === 'ta' ? 'அமைதி' : 'relaxed',
                angry: currentLang === 'ta' ? 'கோபம்' : 'angry',
                alone: currentLang === 'ta' ? 'தனிமை' : 'alone',
                motivation: currentLang === 'ta' ? 'உத்வேகம்' : 'motivated',
                devotional: currentLang === 'ta' ? 'பக்தி' : 'devotional'
            };
            const label = moodLabels[detectedKey] || detectedKey;
            const finalGreeting = {
                ta: `உங்கள் பதில்களின் அடிப்படையில், நீங்கள் ${label} மனநிலையில் இருப்பதாகத் தெரிகிறது!`,
                en: `Based on your answers, it seems you are feeling ${label} right now!`
            };
            speak(finalGreeting[currentLang]);
        }, 1500);
    }

    // Smart heuristic: score moods based on answer-option mood-map weights
    function heuristicMoodDetection() {
        const scores = {};
        const validKeys = ['happy', 'sad', 'romantic', 'energetic', 'relaxed', 'angry', 'alone', 'motivation', 'devotional'];
        validKeys.forEach(k => scores[k] = 0);

        const questions = discoveryQuestions[currentLang];

        // Primary scoring: match each selected answer text against its moodMap
        discoveryResponses.forEach((resp, qi) => {
            if (!questions[qi]) return;
            const options = questions[qi].options;
            const moodMap = questions[qi].moodMap;
            const idx = options.indexOf(resp);
            if (idx !== -1 && moodMap && moodMap[idx]) {
                scores[moodMap[idx]] = (scores[moodMap[idx]] || 0) + 2; // weight: 2 per direct match
            }
        });

        // Secondary scoring: keyword scan across all answer text
        const text = discoveryResponses.join(' ').toLowerCase();
        const keywordBoosts = {
            angry: ['angry', 'frustrated', 'rage', 'thunder', 'irritated', 'இடி', 'கோபம்', 'எரிச்சல்'],
            sad: ['sad', 'tired', 'pain', 'cry', 'rain', 'hopeless', 'சோர்வாக', 'மழை', 'சோகம்', 'வருத்தம்'],
            energetic: ['energy', 'dance', 'ready', 'active', 'hyped', 'உற்சாகம்', 'ஆடத் தயார்', 'பரபரப்பு'],
            romantic: ['love', 'someone special', 'crush', 'காதல்', 'நேசிக்கிறேன்', 'அன்பு'],
            motivation: ['success', 'goals', 'work', 'focused', 'hustle', 'வெற்றி', 'உத்வேகம்', 'இலக்கு'],
            relaxed: ['peaceful', 'calm', 'chill', 'vibing', 'easy', 'அமைதி', 'நிதானம்', 'ரிலாக்ஸ்'],
            happy: ['celebration', 'joy', 'confetti', 'smile', 'கொண்டாட்டம்', 'மகிழ்ச்சி', 'சந்தோஷம்'],
            alone: ['alone', 'hide', 'isolated', 'nobody', 'தனிமை', 'யாரும் இல்லை'],
            devotional: ['prayer', 'god', 'temple', 'spiritual', 'meditate', 'பக்தி', 'கடவுள்', 'கோவில்', 'தியானம்']
        };

        for (const [mood, kwList] of Object.entries(keywordBoosts)) {
            kwList.forEach(kw => { if (text.includes(kw)) scores[mood] += 1; });
        }

        console.log("Mood scores:", scores);

        // Pick the mood with highest score
        let best = 'happy', bestScore = -1;
        for (const [mood, score] of Object.entries(scores)) {
            if (score > bestScore) { bestScore = score; best = mood; }
        }

        // If all scores are 0, default to happy
        return best;
    }

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('appLang', lang);

        // Update UI buttons
        langBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-lang') === lang));

        // Update Discovery Button if active
        if (isDiscoveryMode) {
            const stopBtnText = currentLang === 'ta' ? "அமைர்வை நிறுத்து" : "Stop Session";
            discoveryBtn.innerHTML = `<span class="sparkle">❌</span> ${stopBtnText}`;
            // Refresh question text but keep progress
            const currentQ = discoveryQuestions[currentLang][discoveryStep].q;
            typeWriter(aiResponse, currentQ);
            renderDiscoveryOptions(discoveryStep);
        } else {
            const startBtnText = currentLang === 'ta' ? "என்னுடன் உங்கள் மனநிலையைக் கண்டறியவும்" : "Find Your Mood with Me";
            discoveryBtn.innerHTML = `<span class="sparkle">✨</span> ${startBtnText}`;
        }

        // Update Voice
        updateVoiceForLanguage();

        // Re-apply current mood if active to refresh content language
        if (currentMood) {
            applyMood(currentMood, !isDiscoveryMode); // Don't animate if coming from discovery completion
        } else {
            // Update initial greeting
            const greeting = {
                ta: "வணக்கம்! நான் உங்கள் நண்பன். இன்று நீங்கள் எப்படி இருக்கிறீர்கள்?",
                en: "Hello! I'm your companion. How are you feeling today?"
            };
            aiResponse.textContent = greeting[lang];
            // Only speak if user explicitly switched (avoid double speech on load)
            if (lang !== localStorage.getItem('appLang')) speak(greeting[lang]);
        }
    }

    // Core Functions
    function applyMood(moodKey, animate = true) {
        const moodData = moods[moodKey];
        if (!moodData) return;

        currentMood = moodKey;
        localStorage.setItem('userMood', moodKey);

        // Update UI Classes
        document.body.className = `mood-${moodKey}`;

        // Update Active Button
        moodBtns.forEach(btn => {
            const isActive = btn.getAttribute('data-mood') === moodKey;
            if (isActive && btn.classList.contains('active')) {
                // Same mood clicked again, don't trigger surprise again
            } else if (isActive) {
                hasPlayedVideoInSession = false; // Reset flag for new mood
            }
            btn.classList.toggle('active', isActive);
        });

        // Update Wallpaper
        wallpaperOverlay.style.backgroundImage = moodData.wallpaper;
        wallpaperOverlay.style.opacity = '1';

        // Update Mood Label
        moodLabel.textContent = `Current Mood: ${moodKey.charAt(0).toUpperCase() + moodKey.slice(1)}`;

        // Trigger animation reset for AI Logo
        aiLogo.style.animation = 'none';
        void aiLogo.offsetWidth;
        aiLogo.style.animation = '';

        // Reset UI Response State
        aiResponse.parentElement.style.animation = 'none';

        // Check for Surprise Condition
        const isSurprise = animate && situationVideos[moodKey] && !hasPlayedVideoInSession && Math.random() < 0.4;

        if (isSurprise) {
            console.log("Surprise! Auto-playing situation video.");
            hasPlayedVideoInSession = true;
            situationSection.classList.remove('hidden');

            const wasPlaying = !audioPlayer.paused;

            // Set up pending action to be triggered after video
            pendingMoodAction = () => {
                executeMoodResponse(moodKey, true);
                if (wasPlaying) {
                    audioPlayer.play().catch(e => console.warn("Could not resume audio after video."));
                }
            };

            // Show video immediately
            playSituationVideo();
        } else {
            // Normal flow
            if (situationVideos[moodKey]) {
                situationSection.classList.remove('hidden');
            } else {
                situationSection.classList.add('hidden');
            }
            executeMoodResponse(moodKey, animate);
        }
    }

    function executeMoodResponse(moodKey, animate) {
        const moodData = moods[moodKey];
        const responseText = moodData.response[currentLang];

        if (animate) {
            aiResponse.parentElement.style.animation = 'none';
            void aiResponse.parentElement.offsetWidth;
            aiResponse.parentElement.style.animation = 'fadeIn 0.5s ease-out';

            // Sequence: Speak -> Then Ask for music
            const musicPrompt = {
                ta: "நான் உங்களுக்காக இந்த மனநிலைக்கு ஏற்ற இசையை ஒலிக்கச் செய்யவா? (ஆம் அல்லது இல்லை)",
                en: "Would you like me to play some music for this mood? (Yes or No)"
            };

            const fullResponse = `${responseText} ${musicPrompt[currentLang]}`;
            pendingMusicMood = moodKey; // Store for later if they say yes

            speak(fullResponse);

            // Confetti for Happy
            if (moodKey === 'happy') {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: [moodData.color, '#ffffff', '#ff0000']
                });
            }
        } else {
            // No direct auto-play even in non-animate mode
            pendingMusicMood = moodKey;
        }

        typeWriter(aiResponse, responseText + " " + (currentLang === 'ta' ? "நான் இசை ஒலிக்கவா?" : "Should I play music?"));
        updateQuote();

        if (quoteInterval) clearInterval(quoteInterval);
        quoteInterval = setInterval(updateQuote, 15000);
    }

    function playMoodMusic(moodKey) {
        const moodData = moods[moodKey];
        if (moodData.songs && moodData.songs.length > 0) {
            const shuffled = shuffleArray(moodData.songs);
            const firstSong = shuffled[0];

            window.currentPlaylist = shuffled;
            window.currentSongIndex = 0;

            audioPlayer.src = firstSong.src;
            songTitle.textContent = firstSong.title;

            audioPlayer.play()
                .then(() => {
                    playPauseBtn.textContent = '⏸️';
                    playerBar.classList.remove('paused');
                })
                .catch(e => console.log("Audio deferred."));

            audioPlayer.onended = () => {
                playNextSong();
            };
        }
    }

    function updateQuote() {
        if (!currentMood || !moods[currentMood]) return;

        const moodData = moods[currentMood];
        const quotesList = moodData.quotes[currentLang];

        if (quotesList && quotesList.length > 0) {
            const moodQuoteEle = document.getElementById('mood-quote');
            const quoteAuthorEle = document.getElementById('quote-author');

            const randomQuote = quotesList[Math.floor(Math.random() * quotesList.length)];

            // Subtle transition
            const quoteCard = document.querySelector('.quote-card');
            quoteCard.style.opacity = '0';

            setTimeout(() => {
                moodQuoteEle.textContent = randomQuote.text;
                quoteAuthorEle.textContent = `— ${randomQuote.author}`;
                quoteCard.style.opacity = '1';
                quoteCard.style.transform = 'scale(0.98)';
                setTimeout(() => quoteCard.style.transform = 'scale(1)', 200);
            }, 300);
        }
    }

    function togglePlayPause() {
        if (audioPlayer.paused) {
            audioPlayer.play();
            playPauseBtn.textContent = '⏸️';
            playerBar.classList.remove('paused');
        } else {
            audioPlayer.pause();
            playPauseBtn.textContent = '▶️';
            playerBar.classList.add('paused');
        }
    }

    function playNextSong() {
        if (!window.currentPlaylist || window.currentPlaylist.length === 0) {
            return; // No playlist available
        }

        // Move to next song in playlist
        window.currentSongIndex = (window.currentSongIndex + 1) % window.currentPlaylist.length;
        const nextSong = window.currentPlaylist[window.currentSongIndex];

        audioPlayer.src = nextSong.src;
        songTitle.textContent = nextSong.title;

        audioPlayer.play()
            .then(() => {
                playPauseBtn.textContent = '⏸️';
                playerBar.classList.remove('paused');
            })
            .catch(e => console.log("Audio play error:", e));
    }

    function playPreviousSong() {
        if (!window.currentPlaylist || window.currentPlaylist.length === 0) {
            return; // No playlist available
        }

        // Move to previous song in playlist
        window.currentSongIndex = (window.currentSongIndex - 1 + window.currentPlaylist.length) % window.currentPlaylist.length;
        const prevSong = window.currentPlaylist[window.currentSongIndex];

        audioPlayer.src = prevSong.src;
        songTitle.textContent = prevSong.title;

        audioPlayer.play()
            .then(() => {
                playPauseBtn.textContent = '⏸️';
                playerBar.classList.remove('paused');
            })
            .catch(e => console.log("Audio play error:", e));
    }

    async function detectMoodFromText(text) {
        const input = text.toLowerCase().trim();
        if (!input) return;

        // Route to discovery mode if active
        if (isDiscoveryMode) {
            await handleDiscoveryResponse(text);
            return;
        }

        // Music Control Recognition
        const stopKeywords = ['இசையை நிறுத்து', 'பாடலை நிறுத்து', 'நிறுத்து', 'இசை வேண்டாம்'];
        const playKeywords = ['start music', 'music on', 'இசையை ஒலிக்கச் செய்', 'பாடலை ஒடு', 'இசை வேண்டும்', 'ஒலிக்கச் செய்'];
        const yesKeywords = ['yes', 'yeah', 'sure', 'okay', 'yep', 'ok', 'ஆம்', 'சரி', 'நிச்சயமாக'];
        const noKeywords = ['no', 'not now', 'nah', 'இல்லை', 'வேண்டாம்'];

        const hasStop = input.includes('stop') || input.includes('நிறுத்து');
        const hasMusic = input.includes('music') || input.includes('இசை') || input.includes('பாடல்');
        const hasPlay = input.includes('play') || input.includes('ஒலி') || input.includes('தொடங்கு');

        if ((hasStop && hasMusic) || stopKeywords.some(kw => input.includes(kw))) {
            audioPlayer.pause();
            playPauseBtn.textContent = '▶️';
            playerBar.classList.add('paused');
            const msg = currentLang === 'ta' ? "இசை நிறுத்தப்பட்டது." : "Music stopped.";
            typeWriter(aiResponse, msg);
            speak(msg);
            return;
        }

        if ((hasPlay && hasMusic) || playKeywords.some(kw => input.includes(kw)) || (pendingMusicMood && yesKeywords.some(kw => input.includes(kw)))) {
            const moodToPlay = pendingMusicMood || currentMood || 'happy';
            playMoodMusic(moodToPlay);
            pendingMusicMood = null;
            const msg = currentLang === 'ta' ? "நிச்சயமாக, இசையை ஒலிக்கச் செய்கிறேன்!" : "Sure, starting the music for you!";
            typeWriter(aiResponse, msg);
            speak(msg);
            return;
        }

        if (pendingMusicMood && noKeywords.some(kw => input.includes(kw))) {
            pendingMusicMood = null;
            const msg = currentLang === 'ta' ? "சரி, உங்களுக்கு இசை தேவைப்படும்போது சொல்லுங்கள்." : "Alright, let me know when you'd like some music.";
            typeWriter(aiResponse, msg);
            speak(msg);
            return;
        }

        // Check for Name detection
        const nameKeywords = ['my name is', 'i am', 'பெயர்', 'நாந்தான்', 'iam', 'நான் ', 'எனது பெயர்'];
        let detectedName = null;

        for (const kw of nameKeywords) {
            if (input.includes(kw)) {
                const parts = input.split(kw);
                if (parts.length > 1 && parts[1].trim()) {
                    detectedName = parts[1].trim().split(' ')[0]; // Take first word after keyword
                    break;
                }
            }
        }

        if (detectedName) {
            const welcomeMsg = {
                ta: `வணக்கம் ${detectedName}! உங்களை வரவேப்பதில் மகிழ்ச்சி. இன்று உங்கள் மனநிலை எப்படி இருக்கிறது?`,
                en: `Hello ${detectedName}! Great to have you here. How's your mood today?`
            };
            const msg = welcomeMsg[currentLang];
            typeWriter(aiResponse, msg);
            speak(msg);
            return;
        }

        // Score-based keyword detection — count all matches, pick the highest
        const scores = {};
        for (const [key, data] of Object.entries(moods)) {
            scores[key] = data.keywords.filter(kw => input.includes(kw)).length;
        }

        const topMood = Object.entries(scores).reduce((best, [key, score]) =>
            score > best[1] ? [key, score] : best, ['', 0]);

        let detected = topMood[1] > 0 ? topMood[0] : null;

        console.log("Keyword scores:", scores, "→ detected:", detected);

        if (detected) {
            applyMood(detected);
        } else {
            // 2. If no mood detected, treat as a general question/statement
            await handleGeneralQuery(input);
        }
    }

    async function handleGeneralQuery(input) {
        // Hardcoded knowledge for brand consistency
        const aiKnowledge = [
            {
                keywords: ['who are you', 'your name', 'about yourself', 'யார் நீ'],
                response: {
                    ta: "நான் உங்கள் மூட் பிளேகிரவுண்ட் நண்பன், லோகி டெக்னாலஜிஸ் மூலம் உருவாக்கப்பட்டவன்! உங்களுடன் உரையாடவும் சிறந்த பாடல்களை ஒலிக்கச் செய்யவும் நான் இங்கே இருக்கிறேன்.",
                    en: "I'm your Mood Playground companion, created by Loki Technologies! I'm here to vibe with you and play some great music."
                }
            },
            {
                keywords: ['loki technologies', 'who made you', 'உன்னை உருவாக்கியது யார்'],
                response: {
                    ta: "நான் லோகி டெக்னாலஜிஸின் சிறந்த சிந்தனையாளர்களால் அன்புடன் உருவாக்கப்பட்டேன். அவர்கள் உங்களைப் போன்ற மகிழ்ச்சியான அனுபவங்களை உருவாக்குவதில் சிறந்தவர்கள்!",
                    en: "I was crafted with love by the brilliant minds at Loki Technologies. They specialize in creating professional, playful experiences like this one!"
                }
            },
            {
                keywords: ['what can you do', 'help', 'features', 'என்ன செய்ய முடியும்'],
                response: {
                    ta: "உங்களின் மனநிலையை என்னால் அறிய முடியும், அதற்கு ஏற்றவாறு பின்னணியை மாற்ற முடியும், சிறந்த பாடல்களை ஒலிக்கச் செய்ய முடியும் மற்றும் உங்களுடன் உரையாட முடியும்!",
                    en: "I can detect your mood, change this playground's theme, play curated songs, and chat with you about anything! Just talk to me."
                }
            }
        ];

        let matchedResponse = null;

        // Check hardcoded knowledge first
        for (const item of aiKnowledge) {
            if (item.keywords.some(kw => input.includes(kw))) {
                matchedResponse = item.response;
                break;
            }
        }

        if (matchedResponse) {
            const finalResp = matchedResponse[currentLang];
            typeWriter(aiResponse, finalResp);
            speak(finalResp);
            // Save to history too even if hardcoded
            chatHistory.push({ role: 'user', text: input });
            chatHistory.push({ role: 'assistant', text: finalResp });
            return;
        }

        // Real-time AI for anything else
        typeWriter(aiResponse, currentLang === 'ta' ? "யோசிக்கிறேன்..." : "Thinking...");
        aiLogo.classList.add('active');

        let aiText = '';

        try {
            const systemPrompt = `You are the Mood Playground Universal AI, powered by Loki Technologies. You are an expert in everything (Science, History, Tech, etc.). Respond in ${currentLang === 'ta' ? 'Tamil' : 'English'}. Be helpful, intelligent, and concise.`;

            // Build history context (last 6 messages)
            const contextLimit = 6;
            const recentHistory = chatHistory.slice(-contextLimit);
            const historyText = recentHistory.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join('\n');
            const fullPrompt = `${systemPrompt}\n\n${historyText}\nUser: ${input}\nAssistant:`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);

            try {
                const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        inputs: `<s>[INST] ${fullPrompt} [/INST]`,
                        parameters: {
                            max_new_tokens: 200,
                            temperature: 0.7,
                            return_full_text: false
                        }
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) throw new Error('API unstable or busy');

                const result = await response.json();
                if (Array.isArray(result) && result[0]?.generated_text) {
                    aiText = result[0].generated_text.trim();
                } else if (result.generated_text) {
                    aiText = result.generated_text.trim();
                }

                aiText = aiText.replace(/^(User:|Assistant:)/gi, '').trim();

            } catch (primaryError) {
                console.warn("Primary AI failed, using intelligent fallback");
                aiText = generateLocalResponse(input);
            }

            if (aiText) {
                // Save to history
                chatHistory.push({ role: 'user', text: input });
                chatHistory.push({ role: 'assistant', text: aiText });

                // Prune history (keep last 12 to allow 6 exchanges)
                if (chatHistory.length > 12) chatHistory = chatHistory.slice(-12);

                typeWriter(aiResponse, aiText);
                speak(aiText);
            }

        } catch (error) {
            console.error("Chat Error:", error);
            let errorMessage = "உங்களுடன் உரையாடுவதில் மகிழ்ச்சி! உங்கள் மனநிலையைப் பற்றி சொல்லுங்கள்."; // Default Tamil
            if (currentLang === 'en') errorMessage = "I love chatting with you! Tell me more about your mood.";

            if (window.location.protocol === 'file:') {
                errorMessage = currentLang === 'ta' ?
                    "மன்னிக்கவும், பிரவுசர் பாதுகாப்புக் காரணமாக AI வேலை செய்யவில்லை. தயவுசெய்து 'Local Server' பயன்படுத்தவும்." :
                    "Browser security (CORS) is blocking the AI. Please run the project using a local server (like Live Server or Python).";
            }

            aiResponse.textContent = errorMessage;
            speak(errorMessage);
        } finally {
            aiLogo.classList.remove('active');
        }
    }

    // Local response generator for when APIs fail
    function generateLocalResponse(input) {
        const lowerInput = input.toLowerCase();

        // Contextual responses based on keywords
        const contextualResponses = {
            ta: {
                greetings: ["வணக்கம்! நான் உங்கள் மூட் பிளேகிரவுண்ட் நண்பன். உங்கள் மனநிலை எப்படி இருக்கிறது?", "வணக்கம்! உங்களைச் சந்தித்ததில் மகிழ்ச்சி. இன்று எப்படி உணர்கிறீர்கள்?"],
                music: ["இசை என்பது ஆன்மாவின் மொழி! மேலே உள்ள மனநிலை பொத்தான்களில் ஒன்றைத் தேர்ந்தெடுத்தால், நான் உங்களுக்கு சிறந்த பாடல்களை ஒலிக்கச் செய்வேன்.", "நல்ல இசையைக் கேட்க விரும்புகிறீர்களா? உங்கள் மனநிலையைத் தேர்ந்தெடுங்கள், நான் சரியான பாடல்களைக் கண்டுபிடிப்பேன்!"],
                mood: ["உங்கள் மனநிலையைப் பற்றி என்னிடம் சொல்லுங்கள்! மகிழ்ச்சி, சோகம், காதல், உற்சாகம் - எது உங்களுக்குப் பொருந்தும்?", "மனநிலை மாறுவது இயல்பானது. மேலே உள்ள பொத்தான்களில் ஒன்றைத் தேர்ந்தெடுத்து, நான் உங்களுக்கு ஏற்ற சூழலை உருவாக்குகிறேன்."],
                help: ["நான் உங்கள் மனநிலையை அறிய முடியும், பின்னணியை மாற்ற முடியும், சிறந்த பாடல்களை ஒலிக்கச் செய்ய முடியும். மேலே உள்ள பொத்தான்களில் ஒன்றைத் தேர்ந்தெடுத்து தொடங்குங்கள்!", "நான் உங்களுக்கு உதவ இங்கே இருக்கிறேன்! உங்கள் மனநிலையைத் தேர்ந்தெடுங்கள், நான் பாடல்கள் மற்றும் நல்ல வார்த்தைகளுடன் வருகிறேன்."],
                thanks: ["வரவேற்கிறேன்! உங்களுடன் இருப்பதில் மகிழ்ச்சி.", "எப்போதும் வரவேற்கிறேன்! உங்கள் நண்பன் இங்கே இருக்கிறேன்."],
                default: ["அது சுவாரஸ்யமாக இருக்கிறது! உங்கள் மனநிலையை மேலே உள்ள பொத்தான்களில் ஒன்றைத் தேர்ந்தெடுத்து என்னிடம் சொல்லுங்கள்.", "நான் உங்களுடன் இருக்கிறேன்! உங்கள் மனநிலையைப் பற்றி மேலும் சொல்லுங்கள்.", "அருமை! மேலே உள்ள மனநிலை பொத்தான்களில் ஒன்றைத் தேர்ந்தெடுக்கவும்."]
            },
            en: {
                greetings: ["Hello! I'm your Mood Playground companion. How are you feeling today?", "Hi there! Great to meet you. What's your mood like right now?", "Hey! Welcome to your Mood Playground. Tell me how you're feeling!"],
                music: ["Music is the language of the soul! Pick a mood above and I'll play the perfect soundtrack for you.", "Love good music? Choose your mood and I'll find the perfect songs to match your vibe!", "Let's find some great tunes! Select a mood button above and I'll curate the perfect playlist."],
                mood: ["Tell me about your mood! Happy, sad, romantic, energetic - what fits you right now?", "Moods change and that's totally normal. Pick a button above and I'll create the perfect atmosphere for you.", "I'm here to match your vibe! Choose a mood and let's get the right energy going."],
                help: ["I can detect your mood, change the theme, play curated songs, and chat with you! Just pick a mood button above to get started.", "I'm here to help! Choose your mood and I'll bring the music and good vibes.", "I can read your mood, play amazing music, and keep you company. Try the mood buttons above!"],
                thanks: ["You're welcome! Happy to be here with you.", "Anytime! I'm your friend and I'm here for you.", "My pleasure! That's what friends are for!"],
                default: ["That's interesting! Tell me more about your mood by selecting one of the buttons above.", "I'm here with you! Tell me more about how you're feeling.", "Awesome! Try selecting one of the mood buttons above.", "I understand! What's your current mood?", "Sounds good! Pick a mood from the options above and I'll play some great music for you."]
            }
        };

        const responses = contextualResponses[currentLang];

        // Detect context from input
        if (lowerInput.match(/hello|hi|hey|வணக்கம்|ஹாய்/)) {
            return responses.greetings[Math.floor(Math.random() * responses.greetings.length)];
        } else if (lowerInput.match(/music|song|play|பாடல்|இசை/)) {
            return responses.music[Math.floor(Math.random() * responses.music.length)];
        } else if (lowerInput.match(/mood|feel|feeling|மனநிலை|உணர்/)) {
            return responses.mood[Math.floor(Math.random() * responses.mood.length)];
        } else if (lowerInput.match(/help|what can|features|என்ன செய்ய|உதவி/)) {
            return responses.help[Math.floor(Math.random() * responses.help.length)];
        } else if (lowerInput.match(/thank|thanks|நன்றி/)) {
            return responses.thanks[Math.floor(Math.random() * responses.thanks.length)];
        } else {
            return responses.default[Math.floor(Math.random() * responses.default.length)];
        }
    }

    function startVoiceRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            const errorMsg = "Sorry, your browser doesn't support voice recognition.";
            aiResponse.textContent = errorMsg;
            speak(errorMsg);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = (currentLang === 'ta') ? 'ta-IN' : 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        const listenMsg = "Listening... Go ahead, tell me how you feel!";
        aiResponse.textContent = listenMsg;
        // Don't speak "listening" as it might interfere with user's voice input
        aiLogo.classList.add('active');

        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            moodTextInput.value = transcript;
            await detectMoodFromText(transcript);
        };

        recognition.onerror = () => {
            const catchMsg = "Oops, I didn't catch that. Could you try again?";
            aiResponse.textContent = catchMsg;
            speak(catchMsg);
            aiLogo.classList.remove('active');
        };

        recognition.onend = () => {
            aiLogo.classList.remove('active');
        };

        recognition.start();
    }

    // Scan Me QR Code Toggle
    const scanBtn = document.getElementById('scan-me-btn');
    const qrModal = document.getElementById('qr-modal');
    const closeQrBtn = document.getElementById('close-qr-modal');

    if (scanBtn && qrModal && closeQrBtn) {
        scanBtn.addEventListener('click', () => {
            qrModal.classList.add('active');
        });
        closeQrBtn.addEventListener('click', () => {
            qrModal.classList.remove('active');
        });
        qrModal.addEventListener('click', (e) => {
            if (e.target === qrModal) qrModal.classList.remove('active');
        });
    }
});
