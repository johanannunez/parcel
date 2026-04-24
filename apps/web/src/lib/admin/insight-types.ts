// apps/web/src/lib/admin/insight-types.ts
export type InsightPayload = {
  bucket: 'owner_update' | 'house_action';
  severityReason: string;
  sourceCount: number;
  sourceExcerpts: Array<{
    type: 'review' | 'message';
    guestFirstName: string;
    approximateDate: string;
    quote: string;
  }>;
  suggestedFixes: string[];
  isCritical?: boolean;
};

export type { CommunicationInsightPayload } from './communication-types';
