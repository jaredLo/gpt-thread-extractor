import { type Conversation, type ChatMessageNode, type FormattedMessage } from './types';
import { existsSync } from 'node:fs';


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
                const text = node.message!.content.parts.join('\n'); // join multiple parts if they exist
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