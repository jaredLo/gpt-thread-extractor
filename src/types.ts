

export interface ChatMessageAuthor {
    role: string;
    name: string | null;
    metadata: Record<string, unknown>;
}

export interface ChatMessageContent {
    content_type: string;
    parts: string[];
}

export interface ChatMessageMetadata {
    timestamp_?: "absolute" | string;
    finish_details?: Record<string, unknown>;
    model_slug?: string;
    [key: string]: unknown;
}

export interface ChatMessage {
    id: string;
    author: ChatMessageAuthor;
    create_time: number;
    update_time?: number | null;
    content: ChatMessageContent;
    status: string;
    end_turn?: boolean | null;
    weight: number;
    metadata: ChatMessageMetadata;
    recipient: string;
}

export interface ChatMessageNode {
    id: string;
    message?: ChatMessage | null;
    parent?: string | null;
    children: string[];
}

export interface ConversationMapping {
    [nodeId: string]: ChatMessageNode;
}

export interface Conversation {
    id: string;
    title: string;
    create_time: number;
    update_time: number;
    mapping: ConversationMapping;
    moderation_results: unknown[];
    current_node: string;
    plugin_ids: string[] | null;
    conversation_id: string;
    conversation_template_id: string | null;
    gizmo_id: string | null;
    is_archived: boolean;
    safe_urls: string[];
    [key: string]: unknown;
}

export type ExportData = Conversation[];

export type FormattedMessage = string;

export type OutputData = FormattedMessage[];