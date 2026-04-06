// Service interfaces
export type { NotificationService } from './notification';
export type { EmbeddingService } from './embedding';
export type { AIService } from './ai';
export type { BillingService } from './billing';
export type { StorageService } from './storage';
export type { PushService } from './push';

// Parameter types
export type {
  SendEmailParams,
  MatchDigestParams,
  ConnectorNotifyParams,
  OnboardingNudgeParams,
} from './notification';
export type { EmbeddingResult } from './embedding';
export type { ProfileDraftParams, ProfileDraft, MatchReasonParams, AskNudgeParams } from './ai';
export type { CreateSubscriptionParams } from './billing';
export type { UploadParams } from './storage';

// Adapter factories (continued)
export { createSupabaseStorageService } from './storage';
export type { PushNotifyParams, PushSubscribeParams } from './push';

// Adapter factories
export { createResendNotificationService } from './notification';
export { createOpenAIEmbeddingService } from './embedding';
export { createAnthropicAIService } from './ai';
