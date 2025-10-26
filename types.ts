export type ViewType = 'dashboard' | 'input' | 'flowchart' | 'media' | 'game' | 'analytics' | 'settings' | 'podcast' | 'profile';

export interface FlowchartNode {
    id: string;
    type: 'concept' | 'quote' | 'image' | 'question';
    content: string;
    sourceExcerpt?: string;
    position: { x: number; y: number };
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
}

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
    sources?: GroundingSource[];
}

export interface GroundingSource {
    uri: string;
    title: string;
}

export interface LearningContent {
    flowchart: FlowchartNode[];
    videoUrl?: string;
    podcastUrl?: string;
    quiz: QuizQuestion[];
    summary: string;
    sources?: GroundingSource[];
}

export interface Achievement {
    icon: React.ReactNode;
    title: string;
    description: string;
    unlocked: boolean;
}