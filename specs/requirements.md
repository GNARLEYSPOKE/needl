# Needl — Requirements

## Product Summary

Needl is an AI-powered member network platform for franchise-model business networking
organizations. It gives members of chapter-based networks (Corporate Connections, BNI, EO)
the ability to find and connect with the right person anywhere in their global network using
plain language search, standing asks, and warm introductions routed through trusted mutual
connections. The platform is licensed to network operators — not sold to individual members.

## Core Problem

Members of chapter-based networking organizations pay significant annual fees for access to
a global community of business owners. In practice, after 12 months they know everyone in
their chapter and that relationship is saturated. The broader network — hundreds or thousands
of members across dozens of chapters globally — is functionally invisible. The current
workaround is a static dropdown-based directory with no AI matching, no cross-chapter
discovery, and no warm introduction infrastructure. Members who need a specific service
provider in another city have no reliable way to find one. This is why members churn after
year two.

## Target Users

| Persona | Job Title | Primary Goal | Pain Point |
|---------|-----------|--------------|------------|
| The Member | Business owner / founder, $5M–$100M revenue | Find the right service provider or referral partner anywhere in the global network | Network feels local and stale after year one |
| The Chapter Director | Volunteer chapter lead | Keep members engaged, grow chapter, track visitor pipeline | No visibility into who is disengaging before they lapse |
| The Network Admin | VP Member Experience / COO at CC Canada | Demonstrate ROI of platform investment, reduce churn, grow chapters | No aggregate data on member engagement across chapters |
| The Guest / Visitor | Prospective member invited to a meeting | Understand the value of membership before joining | Friction in the invitation and RSVP process |

## Economic Buyers

Corporate Connections Canada (pilot) pays Dotfusion a flat fee of $1,000 CAD per chapter
per month ($12,000/year per chapter). The national or regional franchise owner signs the
contract — not individual chapter directors or members. Members never pay for Needl
directly; it is included in their chapter membership. Post-pilot commercial model scales
per-chapter as CC rolls out nationally and then globally.

## Core User Stories

1. As a Member, I want to type what I need in plain language and get ranked results from
   across my global network, so I can find the right service provider without knowing they exist.

2. As a Member, I want to post a Standing Ask that actively works in the background, so I
   get notified when a new member joins anywhere in the network who matches what I need.

3. As a Member, I want to request a warm introduction routed through the most trusted
   mutual connection, so I can reach a new contact with a vouched, high-trust first impression.

4. As a Member, I want my profile to tell the full story of what I do, who I serve, and
   what results I deliver, so it travels ahead of me in every cross-chapter introduction.

5. As a Member, I want to log a referral in under 20 seconds on mobile, so my chapter
   sees my contribution without administrative overhead.

6. As a Chapter Director, I want to see which members are disengaging before they lapse,
   so I can reach out before the renewal conversation becomes a cancellation conversation.

7. As a Chapter Director, I want to manage my visitor invitation pipeline in one place,
   so I can track who was invited, who showed up, and who followed up.

8. As a Network Admin, I want to see chapter health scores across all chapters in my
   region, so I can identify at-risk chapters and intervene early.

9. As a new Member, I want a guided onboarding flow that gets my profile live and my first
   ask posted in under 30 minutes, so I feel the value of the network immediately.

10. As a Member, I want to invite a guest to my chapter meeting with a personalized link,
    so they can RSVP easily and I can track whether they attended and followed up.

## Non-Goals (What We Are NOT Building)

- Forum or discussion features. CC's Forum is a confidential peer advisory format.
  Digitizing that conversation creates confidentiality liability. Schema stub exists,
  no UI in v1.
- Dues payment processing. CC pays Dotfusion via invoice. Members never see a paywall.
  No member-facing billing, no Stripe checkout for end users.
- Gamification or achievement badges. CC members are $5M+ revenue executives.
- In-app messaging or direct messages. The warm introduction flow handles initiation.
  After connection, members use phone and email.
- AI chatbot for member support.
- Calendar integration. A mailto link with both parties' emails handles scheduling.
- Native iOS or Android apps in v1. Mobile-first responsive web (PWA-ready) first.
- Multi-currency billing. CAD only for the pilot.
- Full LMS or training content management.
- Dues collection or chapter financial management.

## Success Metrics at 12 Months

- $50,000 CAD pilot contract signed with Corporate Connections Canada
- Minimum 4 CC Canada chapters live on the platform
- 60% of active members have a complete profile (completeness score > 70)
- 40% of active members have posted at least one Standing Ask
- At least 20 warm introduction requests initiated across chapters in the first 90 days
- Zero data breaches or RLS policy failures
- Platform architecture passes technical due diligence for a prospective acquirer

## Competitive Position

| Competitor | Needl's Differentiation |
|------------|------------------------|
| BNI Connect | AI-powered natural language search vs. static dropdown directory |
| CC's current platform | Standing Ask engine that works in the background vs. passive profile listing |
| LinkedIn | Warm, vouched introductions within a trusted network vs. cold outreach |
| Salesforce Communities | Built for member networking orgs, not adapted from CRM infrastructure |
| Manual email/text chains | Cross-chapter discovery in under 30 seconds vs. hoping someone knows someone |
