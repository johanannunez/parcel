import {
  InstagramLogo,
  YoutubeLogo,
  GoogleLogo,
  FacebookLogo,
  TiktokLogo,
  XLogo,
  LinkedinLogo,
  Globe,
  Megaphone,
  UsersThree,
  ArrowDown,
  Tag,
  Envelope,
  Phone,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

export type SourceIcon = {
  Icon: Icon;
  color: string;
  accent: string;
};

const DEFAULT: SourceIcon = {
  Icon: Tag,
  color: '#6b7280',
  accent: 'rgba(107, 114, 128, 0.1)',
};

const MAP: Record<string, SourceIcon> = {
  instagram: { Icon: InstagramLogo, color: '#E1306C', accent: 'rgba(225, 48, 108, 0.1)' },
  youtube: { Icon: YoutubeLogo, color: '#FF0000', accent: 'rgba(255, 0, 0, 0.09)' },
  google: { Icon: GoogleLogo, color: '#4285F4', accent: 'rgba(66, 133, 244, 0.1)' },
  facebook: { Icon: FacebookLogo, color: '#1877F2', accent: 'rgba(24, 119, 242, 0.1)' },
  tiktok: { Icon: TiktokLogo, color: '#010101', accent: 'rgba(1, 1, 1, 0.08)' },
  twitter: { Icon: XLogo, color: '#0F1419', accent: 'rgba(15, 20, 25, 0.08)' },
  x: { Icon: XLogo, color: '#0F1419', accent: 'rgba(15, 20, 25, 0.08)' },
  linkedin: { Icon: LinkedinLogo, color: '#0A66C2', accent: 'rgba(10, 102, 194, 0.1)' },
  website: { Icon: Globe, color: '#02AAEB', accent: 'rgba(2, 170, 235, 0.1)' },
  ad: { Icon: Megaphone, color: '#F97316', accent: 'rgba(249, 115, 22, 0.1)' },
  ads: { Icon: Megaphone, color: '#F97316', accent: 'rgba(249, 115, 22, 0.1)' },
  referral: { Icon: UsersThree, color: '#8B5CF6', accent: 'rgba(139, 92, 246, 0.1)' },
  inbound: { Icon: ArrowDown, color: '#10B981', accent: 'rgba(16, 185, 129, 0.1)' },
  email: { Icon: Envelope, color: '#6366F1', accent: 'rgba(99, 102, 241, 0.1)' },
  phone: { Icon: Phone, color: '#059669', accent: 'rgba(5, 150, 105, 0.1)' },
  call: { Icon: Phone, color: '#059669', accent: 'rgba(5, 150, 105, 0.1)' },
};

export function getSourceIcon(slug: string): SourceIcon {
  return MAP[slug.toLowerCase()] ?? DEFAULT;
}
