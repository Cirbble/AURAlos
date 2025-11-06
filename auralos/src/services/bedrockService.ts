// AWS Bedrock Agent Service
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';

const client = new BedrockAgentRuntimeClient({
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
    sessionToken: import.meta.env.VITE_AWS_SESSION_TOKEN || undefined,
  },
});

export interface AgentResponse {
  text: string;
  sessionId: string;
  isComplete: boolean;
}

export interface AgentMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
}

/**
 * Invoke the Bedrock Agent with a message
 */
export async function invokeAgent(
  message: string,
  sessionId: string,
  imageS3Key?: string
): Promise<AgentResponse> {
  try {
    const inputText = imageS3Key
      ? `User uploaded image at s3://${import.meta.env.VITE_S3_BUCKET}/${imageS3Key}. ${message}`
      : message;

    // Use TSTALIASID which is the built-in test alias for draft versions
    // This bypasses the need for a custom alias
    const command = new InvokeAgentCommand({
      agentId: import.meta.env.VITE_AGENT_ID,
      agentAliasId: 'TSTALIASID', // Built-in test alias for draft agent versions
      sessionId: sessionId,
      inputText: inputText,
    });

    const response = await client.send(command);

    // Process the event stream
    let agentResponse = '';
    let isComplete = false;

    if (response.completion) {
      for await (const event of response.completion) {
        if (event.chunk?.bytes) {
          const text = new TextDecoder().decode(event.chunk.bytes);
          agentResponse += text;
        }

        if (event.trace) {
          console.log('Agent trace:', event.trace);
        }
      }
      isComplete = true;
    }

    return {
      text: agentResponse || 'I apologize, but I encountered an issue. Could you try again?',
      sessionId: sessionId,
      isComplete: isComplete,
    };
  } catch (error) {
    console.error('Error invoking agent:', error);
    throw new Error(`Failed to communicate with AI agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Store conversation history in localStorage
 */
export function saveConversation(sessionId: string, messages: AgentMessage[]): void {
  localStorage.setItem(`auralos-conversation-${sessionId}`, JSON.stringify(messages));
}

/**
 * Load conversation history from localStorage
 */
export function loadConversation(sessionId: string): AgentMessage[] {
  const stored = localStorage.getItem(`auralos-conversation-${sessionId}`);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Clear conversation history
 */
export function clearConversation(sessionId: string): void {
  localStorage.removeItem(`auralos-conversation-${sessionId}`);
}

