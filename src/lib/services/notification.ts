import { Resend } from 'resend';

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export interface MatchDigestParams {
  recipientEmail: string;
  recipientName: string;
  matches: Array<{
    companyName: string;
    tagline: string;
    matchReason: string;
    matchId: string;
  }>;
  appUrl: string;
}

export interface ConnectorNotifyParams {
  connectorEmail: string;
  connectorName: string;
  requesterName: string;
  requesterCompany: string;
  targetName: string;
  message: string;
  introductionId: string;
  appUrl: string;
}

export interface OnboardingNudgeParams {
  memberEmail: string;
  memberName: string;
  completedSteps: number;
  totalSteps: number;
  appUrl: string;
}

export interface NotificationService {
  sendEmail(
    params: SendEmailParams,
  ): Promise<{ data: { id: string } | null; error: string | null }>;
  sendMatchDigest(
    params: MatchDigestParams,
  ): Promise<{ data: { id: string } | null; error: string | null }>;
  notifyConnector(
    params: ConnectorNotifyParams,
  ): Promise<{ data: { id: string } | null; error: string | null }>;
  sendOnboardingNudge(
    params: OnboardingNudgeParams,
  ): Promise<{ data: { id: string } | null; error: string | null }>;
}

const FROM_ADDRESS = 'Needl <notifications@needl.app>';

export function createResendNotificationService(apiKey: string): NotificationService {
  const resend = new Resend(apiKey);

  async function send(
    to: string,
    subject: string,
    html: string,
  ): Promise<{ data: { id: string } | null; error: string | null }> {
    try {
      const result = await resend.emails.send({
        from: FROM_ADDRESS,
        to,
        subject,
        html,
      });

      if (result.error) {
        return { data: null, error: result.error.message };
      }

      return { data: { id: result.data?.id ?? '' }, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown email error';
      return { data: null, error: message };
    }
  }

  return {
    async sendEmail(
      params: SendEmailParams,
    ): Promise<{ data: { id: string } | null; error: string | null }> {
      return send(params.to, params.subject, params.html);
    },

    async sendMatchDigest(
      params: MatchDigestParams,
    ): Promise<{ data: { id: string } | null; error: string | null }> {
      const matchListHtml = params.matches
        .map(
          (m) => `
          <div style="margin-bottom: 16px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <strong>${m.companyName}</strong>
            <p style="margin: 4px 0; color: #64748b;">${m.tagline}</p>
            <p style="margin: 4px 0; font-style: italic;">${m.matchReason}</p>
            <a href="${params.appUrl}/matches/${m.matchId}" style="color: #2563eb;">View Match</a>
          </div>`,
        )
        .join('');

      const html = `
        <h2>Hi ${params.recipientName},</h2>
        <p>Needl found ${params.matches.length} new match${params.matches.length > 1 ? 'es' : ''} for your ask:</p>
        ${matchListHtml}
        <p><a href="${params.appUrl}/asks">View all your asks</a></p>
      `;

      return send(
        params.recipientEmail,
        `Needl found ${params.matches.length} match${params.matches.length > 1 ? 'es' : ''} for your ask`,
        html,
      );
    },

    async notifyConnector(
      params: ConnectorNotifyParams,
    ): Promise<{ data: { id: string } | null; error: string | null }> {
      const html = `
        <h2>Hi ${params.connectorName},</h2>
        <p><strong>${params.requesterName}</strong> from ${params.requesterCompany} is requesting an introduction to <strong>${params.targetName}</strong>.</p>
        <blockquote style="border-left: 3px solid #e2e8f0; padding-left: 12px; color: #64748b;">${params.message}</blockquote>
        <p><a href="${params.appUrl}/introductions/${params.introductionId}" style="color: #2563eb;">Respond to this request</a></p>
      `;

      return send(
        params.connectorEmail,
        `${params.requesterName} is requesting an introduction`,
        html,
      );
    },

    async sendOnboardingNudge(
      params: OnboardingNudgeParams,
    ): Promise<{ data: { id: string } | null; error: string | null }> {
      const html = `
        <h2>Hi ${params.memberName},</h2>
        <p>You've completed ${params.completedSteps} of ${params.totalSteps} steps to get the most out of your network.</p>
        <p><a href="${params.appUrl}/onboarding" style="color: #2563eb;">Complete your profile</a></p>
      `;

      return send(params.memberEmail, 'Finish setting up your Needl profile', html);
    },
  };
}
