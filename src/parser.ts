import {
    type Conversation,
    type ChatMessageNode,
    type FormattedMessage,
    type ChatMessageContentPart,
    type StructuredContentPart,
    type AudioTranscriptionPart,
    type AudioAssetPointerPart,
    type RealTimeUserAudioVideoAssetPointerPart
} from './types';
import { existsSync } from 'node:fs';


function isStructuredContentPart(part: ChatMessageContentPart): part is StructuredContentPart {
    return typeof part === 'object' && part !== null && 'content_type' in part;
}

function extractTextFromParts(parts: ChatMessageContentPart[]): string {
    if (!parts || parts.length === 0) {
        return '';
    }

    const fragments: string[] = [];
    const audioPlaceholders: string[] = [];
    let sawAudio = false;

    for (const part of parts) {
        const { text, isAudio, placeholder } = extractTextFromPart(part);
        if (text) {
            fragments.push(text);
        }
        if (placeholder) {
            audioPlaceholders.push(placeholder);
        }
        if (isAudio) {
            sawAudio = true;
        }
    }

    if (fragments.length > 0) {
        return fragments.join('\n');
    }

    if (audioPlaceholders.length > 0) {
        return audioPlaceholders[0]!;
    }

    if (sawAudio) {
        return '[voice message: no transcript available]';
    }

    return '';
}

function extractTextFromPart(part: ChatMessageContentPart): { text: string | null; isAudio: boolean; placeholder: string | null } {
    if (typeof part === 'string') {
        const trimmed = part.trim();
        return { text: trimmed.length > 0 ? trimmed : null, isAudio: false, placeholder: null };
    }

    if (!isStructuredContentPart(part)) {
        return { text: null, isAudio: false, placeholder: null };
    }

    switch (part.content_type) {
        case 'audio_transcription': {
            const audioPart = part as AudioTranscriptionPart;
            const transcription = typeof audioPart.text === 'string' ? audioPart.text.trim() : '';
            return {
                text: transcription.length > 0 ? transcription : null,
                isAudio: true,
                placeholder: null
            };
        }
        case 'audio_asset_pointer': {
            const audioPointer = part as AudioAssetPointerPart;
            const result = buildAudioTextFromPointer(audioPointer);
            return { text: result.text, placeholder: result.placeholder, isAudio: true };
        }
        case 'real_time_user_audio_video_asset_pointer': {
            const realTimePart = part as RealTimeUserAudioVideoAssetPointerPart;
            const nested = realTimePart.audio_asset_pointer;
            if (nested) {
                const nestedResult = buildAudioTextFromPointer(nested);
                return {
                    text: nestedResult.text,
                    placeholder: nestedResult.placeholder ?? '[voice message: audio clip]',
                    isAudio: true
                };
            }
            return { text: null, placeholder: '[voice message: audio clip]', isAudio: true };
        }
        default: {
            const candidate = (part as { text?: unknown }).text;
            if (typeof candidate === 'string') {
                const trimmed = candidate.trim();
                if (trimmed.length > 0) {
                    return { text: trimmed, isAudio: false, placeholder: null };
                }
            }
            return { text: `[${part.content_type}]`, isAudio: false, placeholder: null };
        }
    }
}

function buildAudioTextFromPointer(part: AudioAssetPointerPart): { text: string | null; placeholder: string | null } {
    const metadata = part.metadata as Record<string, unknown> | undefined;

    if (metadata) {
        const transcription = extractTranscription(metadata);
        if (transcription) {
            return { text: transcription, placeholder: null };
        }
    }

    const format = typeof part.format === 'string' ? part.format.toUpperCase() : undefined;
    const duration = metadata ? extractDuration(metadata) : null;

    const formatLabel = format ? ` ${format}` : '';
    const durationLabel = duration ? ` ~${duration}s` : '';
    return { text: null, placeholder: `[voice message: audio clip${formatLabel}${durationLabel}]` };
}

function extractTranscription(metadata: Record<string, unknown>): string | null {
    const transcription = metadata['transcription'];
    if (typeof transcription === 'string' && transcription.trim().length > 0) {
        return transcription.trim();
    }

    const wordTranscription = metadata['word_transcription'];
    if (typeof wordTranscription === 'string' && wordTranscription.trim().length > 0) {
        return wordTranscription.trim();
    }

    return null;
}

function extractDuration(metadata: Record<string, unknown>): string | null {
    const start = getNumber(metadata['start'] ?? metadata['start_timestamp']);
    const end = getNumber(metadata['end'] ?? metadata['end_timestamp']);

    if (typeof start === 'number' && typeof end === 'number' && end > start) {
        const length = end - start;
        if (length > 0) {
            return length >= 1 ? length.toFixed(1) : length.toFixed(2);
        }
    }

    return null;
}

function getNumber(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export async function extractConversationById(
    conversationId: string
): Promise<FormattedMessage[] | null> {
    const conversationsPath = 'conversations.json';

    if (!existsSync(conversationsPath)) {
        console.error(`Error: conversations.json not found in directory: ${conversationsPath}`);
        return null;
    }

    try {
        console.log(`Reading ${conversationsPath}... (This might take a moment for large files)`);
        const file = Bun.file(conversationsPath);
        // TODO: Bun.file().json() reads the whole file, which is not ideal for large files. Maybe use a streaming parser in the future?

        const allConversations: Conversation[] = await file.json();
        console.log(`Read ${allConversations.length} conversations. Searching for ID: ${conversationId}`);

        const targetConversation = allConversations.find(
            (conv) => conv.conversation_id === conversationId || conv.id === conversationId
        );

        if (!targetConversation) {
            console.error(`Error: Conversation with ID ${conversationId} not found.`);
            return null;
        }

        console.log(`Found conversation: "${targetConversation.title}"`);

        const mapping = targetConversation.mapping;
        if (!mapping) {
            console.error('Error: Conversation mapping data is missing.');
            return null;
        }

        const messageNodes: ChatMessageNode[] = Object.values(mapping);

        const formattedMessages = messageNodes
            .filter(node =>
                node.message?.create_time &&
                node.message?.author?.role &&
                node.message?.content?.parts &&
                node.message.content.parts.length > 0 &&
                (node.message.author.role === 'user' || node.message.author.role === 'assistant')
            )
            .sort((a, b) => (a.message?.create_time ?? 0) - (b.message?.create_time ?? 0))
            .map(node => {
                const role = node.message!.author.role;
                const parts = node.message!.content.parts ?? [];
                const text = extractTextFromParts(parts);
                return `${role}: ${text}`;
            });

        console.log(`Extracted ${formattedMessages.length} user/assistant messages.`);
        return formattedMessages;

    } catch (error) {
        if (error instanceof SyntaxError) {
            console.error(`Error: Failed to parse conversations.json. Is it valid JSON?`, error);
        } else {
            console.error(`An unexpected error occurred during parsing:`, error);
        }
        return null;
    }
}
