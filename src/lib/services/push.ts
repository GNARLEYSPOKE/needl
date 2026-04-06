export interface PushNotifyParams {
  memberId: string;
  title: string;
  body: string;
  url?: string;
}

export interface PushSubscribeParams {
  memberId: string;
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}

export interface PushService {
  notify(params: PushNotifyParams): Promise<{ data: null; error: string | null }>;
  subscribe(params: PushSubscribeParams): Promise<{ data: null; error: string | null }>;
  unsubscribe(endpoint: string): Promise<{ data: null; error: string | null }>;
}
