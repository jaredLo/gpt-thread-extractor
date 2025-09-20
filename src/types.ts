export interface ChatMessageAuthor {
    role: string;
    name: string | null;
    metadata: Record<string, unknown>;
}

export interface ChatMessageContent {
    content_type: string;
    parts: ChatMessageContentPart[];
}

export type ChatMessageContentPart = string | StructuredContentPart;

export interface GenericStructuredContentPart {
    content_type: string;
    [key: string]: unknown;
}

export interface AudioTranscriptionPart extends GenericStructuredContentPart {
    content_type: 'audio_transcription';
    text?: string;
    direction?: string;
    decoding_id?: string | null;
}

export interface AudioAssetPointerPart extends GenericStructuredContentPart {
    content_type: 'audio_asset_pointer';
    asset_pointer?: string;
    size_bytes?: number;
    format?: string;
    metadata?: Record<string, unknown>;
}

export interface RealTimeUserAudioVideoAssetPointerPart extends GenericStructuredContentPart {
    content_type: 'real_time_user_audio_video_asset_pointer';
    audio_asset_pointer?: AudioAssetPointerPart;
    frames_asset_pointers?: unknown[];
    video_container_asset_pointer?: unknown;
    audio_start_timestamp?: number;
    expiry_datetime?: string;
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
export type StructuredContentPart =
    | AudioTranscriptionPart
    | AudioAssetPointerPart
    | RealTimeUserAudioVideoAssetPointerPart
    | GenericStructuredContentPart;
