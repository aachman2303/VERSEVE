import React, { useState, useCallback, useRef } from 'react';
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { FlowchartNode, QuizQuestion, LearningContent, GroundingSource } from '../types';
import { UploadCloudIcon, SparklesIcon, FileTextIcon, ImageIcon, VideoIcon, MicIcon, PlayCircleIcon, TrophyIcon, CheckCircleIcon, XCircleIcon } from './Icons';

// --- UTILITY FUNCTIONS ---
const fileToBase64 = (file: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
    });
};

const decodeBase64 = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


// --- UI COMPONENTS ---
const SkeletonLoader: React.FC<{text: string}> = ({ text }) => (
    <div className="space-y-6 animate-pulse">
        <div className="flex justify-center text-lg font-semibold text-brand-text-light dark:text-brand-text-dark">{text}</div>
        <div className="space-y-4 p-6 bg-brand-secondary-light/50 dark:bg-brand-dark/50 rounded-lg">
            <div className="h-6 bg-brand-subtle-light dark:bg-brand-subtle-dark rounded w-1/4"></div>
            <div className="h-4 bg-brand-subtle-light dark:bg-brand-subtle-dark rounded w-full"></div>
            <div className="h-4 bg-brand-subtle-light dark:bg-brand-subtle-dark rounded w-5/6"></div>
            <div className="h-8 bg-brand-subtle-light dark:bg-brand-subtle-dark rounded w-1/3 mt-4"></div>
        </div>
         <div className="h-48 bg-brand-secondary-light/50 dark:bg-brand-dark/50 rounded-lg"></div>
    </div>
);

const TabButton: React.FC<{label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void; disabled?: boolean}> = ({ label, icon, isActive, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors relative ${
            isActive
                ? 'text-brand-accent-purple'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        {icon} {label}
    </button>
);


// --- MAIN DASHBOARD COMPONENT ---
export const Dashboard: React.FC = () => {
    // --- STATE MANAGEMENT ---
    const [activeTab, setActiveTab] = useState('transform');
    
    // Generic States
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [apiKeySelected, setApiKeySelected] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Learn & Transform State
    const [transformInput, setTransformInput] = useState('');
    const [transformFile, setTransformFile] = useState<File | null>(null);
    const [generatedContent, setGeneratedContent] = useState<LearningContent | null>(null);
    const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);

    // Media Analysis State
    const [analysisFile, setAnalysisFile] = useState<File | null>(null);
    const [analysisPrompt, setAnalysisPrompt] = useState('');
    const [analysisResult, setAnalysisResult] = useState<{ text: string; sources?: GroundingSource[] } | null>(null);

    // Image Generation State
    const [imageGenPrompt, setImageGenPrompt] = useState('');
    const [imageGenAspectRatio, setImageGenAspectRatio] = useState('1:1');
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

    // Image Editing State
    const [editImageFile, setEditImageFile] = useState<File | null>(null);
    const [editImagePrompt, setEditImagePrompt] = useState('');
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
    
    // Audio Transcription State
    const [isRecording, setIsRecording] = useState(false);
    const [transcription, setTranscription] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Quiz Game State
    const [gameStarted, setGameStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);

    // --- API KEY HANDLING ---
    const checkApiKey = useCallback(async () => {
        if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
            setApiKeySelected(true);
            return true;
        }
        setApiKeySelected(false);
        return false;
    }, []);

    const handleSelectApiKey = useCallback(async () => {
        if(window.aistudio) {
            await window.aistudio.openSelectKey();
            setApiKeySelected(true); // Assume success
        }
    }, []);

    const resetErrorAndLoading = () => {
        setIsLoading(false);
        setLoadingText('');
        setError(null);
    }

    const handleDragEvents = (e: React.DragEvent, entering: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(entering);
    }

    const handleDrop = (e: React.DragEvent, setFile: React.Dispatch<React.SetStateAction<File | null>>) => {
        handleDragEvents(e, false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    }
    
    // --- CORE AI HANDLERS ---
    const handleGenerateLearningSet = async () => {
        if (!transformInput.trim() && !transformFile) {
            setError('Please provide some input (text, URL, or file).');
            return;
        }
        setIsLoading(true);
        setGeneratedContent(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            setLoadingText('Searching the web for the latest info...');
            const groundingPrompt = `Based on up-to-date information, provide a comprehensive summary for: "${transformInput}"`;

            const groundingResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ parts: [{ text: groundingPrompt }] }],
                config: { tools: [{googleSearch: {}}] },
            });
            const groundedSummary = groundingResponse.text;
            const rawSources = groundingResponse.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
            const uniqueSources = new Map<string, GroundingSource>();
            rawSources.forEach((chunk: any) => {
                if(chunk.web && chunk.web.uri) uniqueSources.set(chunk.web.uri, { uri: chunk.web.uri, title: chunk.web.title || chunk.web.uri });
            });
            const sources = Array.from(uniqueSources.values());

            setLoadingText('Creating flowchart and quiz...');
            const analysisPrompt = `Analyze this summary and generate a structured flowchart and a 3-question quiz.\nSummary: "${groundedSummary}"`;
            const analysisResponse = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: [{ parts: [{ text: analysisPrompt }] }],
                config: {
                    thinkingConfig: { thinkingBudget: 32768 },
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            flowchart: {
                                type: Type.ARRAY,
                                description: "Array of flowchart nodes.",
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING, description: "Unique identifier for the node." },
                                        type: { type: Type.STRING, description: "Type of the node: 'concept', 'quote', 'image', or 'question'." },
                                        content: { type: Type.STRING, description: "The main text content of the node." },
                                        sourceExcerpt: { type: Type.STRING, description: "A relevant excerpt from the source material, if applicable." },
                                    },
                                    required: ['id', 'type', 'content']
                                }
                            },
                            quiz: {
                                type: Type.ARRAY,
                                description: "Array of quiz questions.",
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        question: { type: Type.STRING, description: "The quiz question." },
                                        options: {
                                            type: Type.ARRAY,
                                            description: "An array of possible answers.",
                                            items: { type: Type.STRING }
                                        },
                                        correctAnswer: { type: Type.STRING, description: "The correct answer from the options." },
                                        explanation: { type: Type.STRING, description: "An explanation for why the answer is correct." },
                                    },
                                    required: ['question', 'options', 'correctAnswer', 'explanation']
                                }
                            }
                        },
                        required: ['flowchart', 'quiz']
                    }
                }
            });
            const parsedResponse = JSON.parse(analysisResponse.text);
            const flowchartWithPositions: FlowchartNode[] = parsedResponse.flowchart.map((node: any, index: number) => ({
                ...node,
                position: { x: (index % 3) * 250, y: Math.floor(index / 3) * 150 }
            }));
            
            const newContent: LearningContent = {
                summary: groundedSummary,
                flowchart: flowchartWithPositions,
                quiz: parsedResponse.quiz,
                sources: sources,
            };

            if (transformInput.trim()) {
                 if(!await checkApiKey()) { handleSelectApiKey(); }
                setLoadingText('Generating AI explainer video...');
                const veoAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const imagePart = transformFile && transformFile.type.startsWith('image/')
                    ? { image: { imageBytes: await fileToBase64(transformFile), mimeType: transformFile.type } }
                    : {};

                let operation = await veoAI.models.generateVideos({
                    model: 'veo-3.1-fast-generate-preview',
                    prompt: `Create a short educational video about: ${groundedSummary}`,
                    ...imagePart,
                    config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
                });

                while (!operation.done) {
                    await new Promise(resolve => setTimeout(resolve, 10000));
                    operation = await veoAI.operations.getVideosOperation({ operation: operation });
                }
                const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
                if(videoUri) {
                    const videoRes = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
                    const videoBlob = await videoRes.blob();
                    newContent.videoUrl = URL.createObjectURL(videoBlob);
                }
            }
            setGeneratedContent(newContent);
        } catch (e: any) {
            console.error(e);
            setError(`An error occurred: ${e.message}`);
        } finally {
            resetErrorAndLoading();
        }
    };
    
    const handlePlayPodcast = async () => {
        if (!generatedContent?.summary) return;
        setIsGeneratingPodcast(true);
        setError(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: generatedContent.summary }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' }}},
                },
            });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if(base64Audio) {
                const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
                const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), outputAudioContext, 24000, 1);
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContext.destination);
                source.start();
            }
        } catch(e: any) {
            setError(`Could not generate podcast: ${e.message}`);
        } finally {
            setIsGeneratingPodcast(false);
        }
    }

    const handleAnalyzeMedia = async () => {
        if (!analysisFile) { setError("Please upload a file to analyze."); return; }
        setIsLoading(true);
        setAnalysisResult(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            let response;
            if (analysisFile.type.startsWith('image/')) {
                setLoadingText("Analyzing image...");
                const base64Data = await fileToBase64(analysisFile);
                response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: { parts: [
                        { inlineData: { mimeType: analysisFile.type, data: base64Data } },
                        { text: analysisPrompt || 'Describe this image in detail. If it is a landmark or known object, identify it.' }
                    ]},
                    config: {
                        tools: [{googleSearch: {}}]
                    }
                });
            } else if (analysisFile.type.startsWith('video/')) {
                 setLoadingText("Analyzing video (this may take a moment)...");
                 const video = document.createElement('video');
                 const canvas = document.createElement('canvas');
                 video.src = URL.createObjectURL(analysisFile);
                 await new Promise(res => video.onloadeddata = res);
                 video.currentTime = video.duration / 2;
                 await new Promise(res => video.onseeked = res);
                 canvas.width = video.videoWidth;
                 canvas.height = video.videoHeight;
                 canvas.getContext('2d')?.drawImage(video, 0, 0);
                 const base64Data = canvas.toDataURL('image/jpeg').split(',')[1];
                 
                 response = await ai.models.generateContent({
                     model: 'gemini-2.5-flash',
                     contents: { parts: [
                         { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                         { text: analysisPrompt || 'Based on this frame, what is this video about? If it contains landmarks or known objects, identify them.' }
                     ]},
                     config: {
                        tools: [{googleSearch: {}}]
                     }
                 });
            } else { throw new Error("Unsupported file type."); }
            
            const rawSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
            const uniqueSources = new Map<string, GroundingSource>();
            rawSources.forEach((chunk: any) => {
                if(chunk.web && chunk.web.uri) uniqueSources.set(chunk.web.uri, { uri: chunk.web.uri, title: chunk.web.title || chunk.web.uri });
            });
            const sources = Array.from(uniqueSources.values());
            
            setAnalysisResult({ text: response.text, sources: sources.length > 0 ? sources : undefined });

        } catch(e: any) {
            setError(`Analysis failed: ${e.message}`);
        } finally {
            resetErrorAndLoading();
        }
    }

    const handleGenerateImage = async () => {
        if (!imageGenPrompt.trim()) { setError("Please enter a prompt."); return; }
        setIsLoading(true);
        setGeneratedImageUrl(null);
        setLoadingText("Generating your image...");
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: imageGenPrompt,
                config: { numberOfImages: 1, aspectRatio: imageGenAspectRatio as any },
            });
            const base64Image = response.generatedImages[0].image.imageBytes;
            setGeneratedImageUrl(`data:image/png;base64,${base64Image}`);
        } catch(e: any) {
            setError(`Image generation failed: ${e.message}`);
        } finally {
            resetErrorAndLoading();
        }
    }

    const handleEditImage = async () => {
        if (!editImageFile || !editImagePrompt.trim()) { setError("Please upload an image and provide an edit instruction."); return; }
        setIsLoading(true);
        setEditedImageUrl(null);
        setLoadingText("Applying your edits...");
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const base64Data = await fileToBase64(editImageFile);
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [
                    { inlineData: { mimeType: editImageFile.type, data: base64Data } },
                    { text: editImagePrompt }
                ]},
                config: { responseModalities: [Modality.IMAGE] },
            });
            const editedPart = response.candidates[0].content.parts.find(p => p.inlineData);
            if (editedPart?.inlineData) {
                setEditedImageUrl(`data:image/png;base64,${editedPart.inlineData.data}`);
            } else { throw new Error("No edited image was returned."); }
        } catch(e: any) {
            setError(`Image editing failed: ${e.message}`);
        } finally {
            resetErrorAndLoading();
        }
    }

    const handleToggleRecording = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            setTranscription(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                audioChunksRef.current = [];
                stream.getTracks().forEach(track => track.stop());
                
                setIsLoading(true);
                setLoadingText("Transcribing audio...");
                try {
                    const base64Data = await fileToBase64(audioBlob);
                    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: { parts: [
                            { inlineData: { mimeType: 'audio/webm', data: base64Data } },
                            { text: 'Transcribe this audio.' }
                        ]}
                    });
                    setTranscription(response.text);
                } catch(e: any) {
                    setError(`Transcription failed: ${e.message}`);
                } finally {
                    resetErrorAndLoading();
                }
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        }
    };
    
    // --- QUIZ GAME LOGIC ---
    const handleStartGame = () => {
        setScore(0);
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setShowFeedback(false);
        setGameStarted(true);
    };

    const handleAnswerSelect = (answer: string) => {
        if (showFeedback) return;

        const isCorrect = answer === generatedContent?.quiz[currentQuestionIndex].correctAnswer;
        setSelectedAnswer(answer);
        if (isCorrect) {
            setScore(prev => prev + 1);
        }
        setShowFeedback(true);

        setTimeout(() => {
            setShowFeedback(false);
            setSelectedAnswer(null);
            setCurrentQuestionIndex(prev => prev + 1);
        }, 1500);
    };

    const tabs = [
        { id: 'transform', label: 'Learn & Transform', icon: <FileTextIcon className="w-5 h-5"/> },
        { id: 'analyze', label: 'Analyze Media', icon: <ImageIcon className="w-5 h-5"/> },
        { id: 'generate', label: 'Generate Image', icon: <SparklesIcon className="w-5 h-5"/> },
        { id: 'edit', label: 'Edit Image', icon: <SparklesIcon className="w-5 h-5"/> },
        { id: 'transcribe', label: 'Transcribe Audio', icon: <MicIcon className="w-5 h-5"/> },
        { id: 'game', label: 'Quiz Game', icon: <TrophyIcon className="w-5 h-5"/>, disabled: !generatedContent }
    ];

    const activeTabIndex = tabs.findIndex(tab => tab.id === activeTab);
    
    // --- RENDER LOGIC ---
    return (
        <div className="space-y-6">
            <div className="bg-brand-light dark:bg-brand-secondary-dark p-2 rounded-xl shadow-lg">
                <div className="relative flex border-b border-gray-200 dark:border-gray-700">
                    {tabs.map(tab => (
                        <TabButton key={tab.id} label={tab.label} icon={tab.icon} isActive={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} disabled={tab.disabled} />
                    ))}
                    <div className="absolute bottom-0 h-0.5 bg-brand-accent-purple transition-all duration-300" style={{ left: `${activeTabIndex * (100 / tabs.length)}%`, width: `${100 / tabs.length}%` }}></div>
                </div>

                <div className="p-6 min-h-[300px]">
                    {/* --- TABS CONTENT --- */}
                    {activeTab === 'transform' && (
                        <div className="animate-fade-in">
                             <h2 className="text-2xl font-bold mb-2">Create New Learning Set</h2>
                             <p className="mb-6 text-gray-600 dark:text-gray-400">Paste a URL, drop a file, or write text to transform it.</p>
                            <textarea value={transformInput} onChange={(e) => setTransformInput(e.target.value)} placeholder="Paste text, an article, a YouTube link..." className="w-full h-24 p-4 bg-brand-secondary-light dark:bg-brand-dark border dark:border-brand-subtle-dark rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-brand-accent-purple" />
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <label 
                                    htmlFor="transform-file" 
                                    onDragEnter={(e) => handleDragEvents(e, true)}
                                    onDragLeave={(e) => handleDragEvents(e, false)}
                                    onDragOver={(e) => handleDragEvents(e, true)}
                                    onDrop={(e) => handleDrop(e, setTransformFile)}
                                    className={`cursor-pointer flex-1 w-full flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg transition-colors ${isDragging ? 'border-brand-accent-purple bg-brand-accent-purple/10' : 'border-gray-300 dark:border-gray-600'}`}>
                                    <UploadCloudIcon className="w-8 h-8 text-gray-500 mb-2" />
                                    <span className="font-semibold text-brand-accent-teal">{transformFile ? transformFile.name : 'Upload image or video'}</span>
                                    <input id="transform-file" type="file" className="sr-only" onChange={(e) => setTransformFile(e.target.files ? e.target.files[0] : null)} />
                                </label>
                                <button onClick={handleGenerateLearningSet} disabled={isLoading} className="w-full md:w-auto text-white font-bold py-3 px-8 rounded-lg bg-gradient-to-r from-brand-accent-purple to-brand-accent-teal transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:bg-gray-500 disabled:from-gray-500 disabled:scale-100">{isLoading ? 'Generating...' : 'Create Learning Set'}</button>
                            </div>
                        </div>
                    )}
                    {activeTab === 'analyze' && (
                         <div className="animate-fade-in">
                            <h2 className="text-2xl font-bold mb-2">Analyze Media</h2>
                            <p className="mb-6 text-gray-600 dark:text-gray-400">Upload an image or video to get an AI-powered analysis.</p>
                            <textarea value={analysisPrompt} onChange={e => setAnalysisPrompt(e.target.value)} placeholder="Optional: What should I look for?" className="w-full p-3 bg-brand-secondary-light dark:bg-brand-dark border dark:border-brand-subtle-dark rounded-lg mb-4" />
                             <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <label htmlFor="analyze-file" className="cursor-pointer flex-1 w-full flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg">
                                    <UploadCloudIcon className="w-8 h-8 text-gray-500 mb-2" />
                                    <span className="font-semibold text-brand-accent-teal">{analysisFile ? analysisFile.name : 'Upload Image/Video'}</span>
                                    <input id="analyze-file" type="file" accept="image/*,video/*" className="sr-only" onChange={(e) => setAnalysisFile(e.target.files ? e.target.files[0] : null)} />
                                </label>
                                <button onClick={handleAnalyzeMedia} disabled={isLoading} className="w-full md:w-auto text-white font-bold py-3 px-8 rounded-lg bg-gradient-to-r from-brand-accent-purple to-brand-accent-teal transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:bg-gray-500 disabled:from-gray-500 disabled:scale-100">{isLoading ? 'Analyzing...' : 'Analyze'}</button>
                            </div>
                        </div>
                    )}
                    {activeTab === 'generate' && (
                         <div className="animate-fade-in">
                            <h2 className="text-2xl font-bold mb-2">Generate Image</h2>
                            <p className="mb-6 text-gray-600 dark:text-gray-400">Describe the image you want to create.</p>
                            <textarea value={imageGenPrompt} onChange={e => setImageGenPrompt(e.target.value)} placeholder="A robot holding a red skateboard..." className="w-full p-3 bg-brand-secondary-light dark:bg-brand-dark border dark:border-brand-subtle-dark rounded-lg mb-4" />
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                               <select value={imageGenAspectRatio} onChange={e => setImageGenAspectRatio(e.target.value)} className="p-3 bg-brand-secondary-light dark:bg-brand-dark border dark:border-brand-subtle-dark rounded-lg">
                                   <option value="1:1">Square (1:1)</option>
                                   <option value="16:9">Landscape (16:9)</option>
                                   <option value="9:16">Portrait (9:16)</option>
                               </select>
                                <button onClick={handleGenerateImage} disabled={isLoading} className="w-full md:w-auto text-white font-bold py-3 px-8 rounded-lg bg-gradient-to-r from-brand-accent-purple to-brand-accent-teal transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:bg-gray-500 disabled:from-gray-500 disabled:scale-100">{isLoading ? 'Generating...' : 'Generate'}</button>
                            </div>
                        </div>
                    )}
                     {activeTab === 'edit' && (
                         <div className="animate-fade-in">
                            <h2 className="text-2xl font-bold mb-2">Edit Image</h2>
                            <p className="mb-6 text-gray-600 dark:text-gray-400">Upload an image and tell the AI how to change it.</p>
                            <textarea value={editImagePrompt} onChange={e => setEditImagePrompt(e.target.value)} placeholder="Add a retro filter..." className="w-full p-3 bg-brand-secondary-light dark:bg-brand-dark border dark:border-brand-subtle-dark rounded-lg mb-4" />
                             <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <label htmlFor="edit-file" className="cursor-pointer flex-1 w-full flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg">
                                    <UploadCloudIcon className="w-8 h-8 text-gray-500 mb-2" />
                                    <span className="font-semibold text-brand-accent-teal">{editImageFile ? editImageFile.name : 'Upload Image'}</span>
                                    <input id="edit-file" type="file" accept="image/*" className="sr-only" onChange={(e) => setEditImageFile(e.target.files ? e.target.files[0] : null)} />
                                </label>
                                <button onClick={handleEditImage} disabled={isLoading} className="w-full md:w-auto text-white font-bold py-3 px-8 rounded-lg bg-gradient-to-r from-brand-accent-purple to-brand-accent-teal transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:bg-gray-500 disabled:from-gray-500 disabled:scale-100">{isLoading ? 'Editing...' : 'Edit Image'}</button>
                            </div>
                        </div>
                    )}
                    {activeTab === 'transcribe' && (
                         <div className="animate-fade-in">
                             <h2 className="text-2xl font-bold mb-2">Transcribe Audio</h2>
                             <p className="mb-6 text-gray-600 dark:text-gray-400">Record your voice and get a text transcription.</p>
                             <button onClick={handleToggleRecording} className={`w-full font-bold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-r from-brand-accent-teal to-green-500'} text-white`}>
                                <MicIcon className="w-5 h-5"/> {isRecording ? 'Stop Recording' : 'Start Recording'}
                             </button>
                        </div>
                    )}
                    {activeTab === 'game' && (
                        <div className="animate-fade-in">
                            <h2 className="text-2xl font-bold mb-2">Interactive Quiz</h2>
                            {!gameStarted ? (
                                <div className="text-center">
                                    <p className="mb-6 text-gray-600 dark:text-gray-400">Test your knowledge on the generated topic!</p>
                                    <button onClick={handleStartGame} className="text-white font-bold py-3 px-8 rounded-lg bg-gradient-to-r from-brand-accent-purple to-brand-accent-teal transition-all duration-300 transform hover:scale-105 hover:shadow-lg">Start Quiz</button>
                                </div>
                            ) : generatedContent && currentQuestionIndex < generatedContent.quiz.length ? (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="text-sm font-semibold">Question {currentQuestionIndex + 1} of {generatedContent.quiz.length}</div>
                                        <div className="text-sm font-bold">Score: {score}</div>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-6">
                                        <div className="bg-brand-accent-teal h-2.5 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / generatedContent.quiz.length) * 100}%` }}></div>
                                    </div>
                                    <h3 className="text-lg font-semibold mb-6">{generatedContent.quiz[currentQuestionIndex].question}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {generatedContent.quiz[currentQuestionIndex].options.map((option, index) => {
                                            const isCorrect = option === generatedContent.quiz[currentQuestionIndex].correctAnswer;
                                            const isSelected = option === selectedAnswer;
                                            let buttonClass = 'bg-brand-secondary-light dark:bg-brand-dark hover:bg-gray-200 dark:hover:bg-gray-800';
                                            if (showFeedback) {
                                                if (isCorrect) buttonClass = 'bg-green-500/20 border-green-500 text-green-500 animate-pop';
                                                else if (isSelected && !isCorrect) buttonClass = 'bg-red-500/20 border-red-500 text-red-500 animate-shake';
                                            }
                                            return (
                                                <button key={index} onClick={() => handleAnswerSelect(option)} disabled={showFeedback} className={`p-4 font-semibold rounded-lg border-2 transition-all duration-300 text-left ${buttonClass}`}>
                                                    {option}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center animate-fade-in">
                                    <h3 className="text-2xl font-bold mb-4">Quiz Complete!</h3>
                                    <p className="text-lg mb-6">Your final score is: <span className="font-bold text-brand-accent-purple">{score} / {generatedContent?.quiz.length}</span></p>
                                    <button onClick={handleStartGame} className="text-white font-bold py-3 px-8 rounded-lg bg-gradient-to-r from-brand-accent-purple to-brand-accent-teal transition-all duration-300 transform hover:scale-105 hover:shadow-lg">Play Again</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            {error && <p className="text-red-500 mt-4 text-center bg-red-500/10 p-3 rounded-lg animate-fade-in">{error}</p>}
            {isLoading && <SkeletonLoader text={loadingText}/>}

            {/* --- RESULTS DISPLAY --- */}
            {analysisResult && activeTab === 'analyze' && (
                <div className="bg-brand-light dark:bg-brand-secondary-dark p-6 rounded-xl shadow-lg whitespace-pre-wrap animate-fade-in">
                    <h3 className="font-bold text-lg mb-2">Analysis Result:</h3>
                    <p>{analysisResult.text}</p>
                    {analysisResult.sources && analysisResult.sources.length > 0 && (
                        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h4 className="font-semibold text-sm mb-2">Sources:</h4>
                            <ul className="space-y-1">
                                {analysisResult.sources.map((source, index) => (
                                    <li key={index}>
                                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-accent-teal hover:underline">
                                            {source.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
            {generatedImageUrl && activeTab === 'generate' && <div className="bg-brand-light dark:bg-brand-secondary-dark p-6 rounded-xl shadow-lg animate-fade-in"><h3 className="font-bold text-lg mb-2">Generated Image:</h3><img src={generatedImageUrl} alt="Generated by AI" className="rounded-lg mx-auto max-h-[512px]" /></div>}
            {editedImageUrl && activeTab === 'edit' && <div className="bg-brand-light dark:bg-brand-secondary-dark p-6 rounded-xl shadow-lg animate-fade-in"><h3 className="font-bold text-lg mb-2">Edited Image:</h3><img src={editedImageUrl} alt="Edited by AI" className="rounded-lg mx-auto max-h-[512px]" /></div>}
            {transcription && activeTab === 'transcribe' && <div className="bg-brand-light dark:bg-brand-secondary-dark p-6 rounded-xl shadow-lg whitespace-pre-wrap animate-fade-in"><h3 className="font-bold text-lg mb-2">Transcription:</h3>{transcription}</div>}

            {generatedContent && activeTab === 'transform' && (
                <div className="space-y-8 animate-fade-in">
                    {/* Summary & Podcast */}
                    <div className="bg-brand-light dark:bg-brand-secondary-dark p-6 rounded-xl shadow-lg">
                       <h3 className="text-xl font-bold mb-3">Summary</h3>
                       <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap mb-4">{generatedContent.summary}</p>
                       <button onClick={handlePlayPodcast} disabled={isGeneratingPodcast} className="bg-brand-accent-teal text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:bg-gray-500 transition-transform transform hover:scale-105">
                           <PlayCircleIcon className="w-5 h-5"/> {isGeneratingPodcast ? 'Generating...' : 'Listen to Podcast'}
                       </button>
                       {generatedContent.sources && generatedContent.sources.length > 0 && (
                            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                                <h4 className="font-semibold text-sm mb-2">Sources:</h4>
                                <ul className="space-y-1">{generatedContent.sources.map((source, index) => (<li key={index}><a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-accent-teal hover:underline">{source.title}</a></li>))}</ul>
                            </div>
                       )}
                    </div>
                     {/* Media */}
                    {generatedContent.videoUrl && (
                         <div className="bg-brand-light dark:bg-brand-secondary-dark p-6 rounded-xl shadow-lg">
                            <h3 className="text-xl font-bold mb-3">AI Explainer Video</h3>
                            <video controls src={generatedContent.videoUrl} className="w-full rounded-lg" />
                         </div>
                    )}
                    {/* Flowchart & Quiz would be displayed here... */}
                </div>
            )}
        </div>
    );
};

if (typeof window !== 'undefined' && !(window as any).aistudio) {
    (window as any).aistudio = {
        hasSelectedApiKey: () => new Promise(res => res(false)),
        openSelectKey: () => new Promise<void>(res => {
            alert('Please select your API key in a real environment. See https://ai.google.dev/gemini-api/docs/billing');
            res();
        }),
    };
}