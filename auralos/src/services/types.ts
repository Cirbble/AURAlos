// Type definitions for AURAlos services

export interface ProductMatch {
  productId: number;
  name: string;
  type: string;
  price: number;
  image: string;
  matchScore: number;
  pros: string[];
  cons: string[];
  reasoning: string;
}

export interface SearchResults {
  topThree: ProductMatch[];
  additionalResults: ProductMatch[];
  totalMatches: number;
  searchId: string;
}

export interface UserPreferences {
  budget?: {
    min: number;
    max: number;
  };
  color?: string;
  material?: string;
  category?: string;
  occasion?: string;
  style?: string;
  mustHaves?: string[];
  dealBreakers?: string[];
}

export interface ConversationState {
  sessionId: string;
  imageS3Key?: string;
  imageUrl?: string;
  preferences: UserPreferences;
  messages: AgentMessage[];
  searchResults?: SearchResults;
  stage: 'upload' | 'conversation' | 'results' | 'refinement';
}

export interface AgentMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
}

