'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Archive, Bell, BookmarkSimple, Briefcase, Buildings, Calendar, CalendarCheck,
  ChartBar, ChartLine, ChartPieSlice, CheckCircle, CircleDashed, Clipboard,
  Clock, Crown, CurrencyDollar, Envelope, Eye, Fire, Flag, FlagBanner,
  Folder, Funnel, Globe, Handshake, Hash, Heart, Hourglass, House, HouseLine,
  InstagramLogo, Key, Leaf, Lightning, List, Lock, MagnifyingGlass, MapPin,
  MapTrifold, Medal, Megaphone, Moon, Note, PaperPlaneRight, Person, PhoneCall,
  Rocket, Shield, Sparkle, Stack, Star, StarFour, Sun, Tag, Target, Timer,
  Trophy, TrendUp, UserCircle, Users, Wallet, YoutubeLogo, ChatDots, ArrowsDownUp,
  Rows, Phone, Gauge, Graph, LinkSimple, ChatCircle, BellSimple, FlagCheckered,
  PersonSimple, UserFocus, HandHeart, Coins,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import styles from './IconPickerPopover.module.css';

export const ICON_MAP: Record<string, Icon> = {
  Archive, Bell, BellSimple, BookmarkSimple, Briefcase, Buildings, Calendar,
  CalendarCheck, ChartBar, ChartLine, ChartPieSlice, CheckCircle, CircleDashed,
  Clipboard, Clock, Crown, CurrencyDollar, Envelope, Eye, Fire, Flag, FlagBanner,
  FlagCheckered, Folder, Funnel, Globe, Handshake, HandHeart, Hash, Heart, Hourglass,
  House, HouseLine, InstagramLogo, Key, Leaf, Lightning, LinkSimple, List, Lock,
  MagnifyingGlass, MapPin, MapTrifold, Medal, Megaphone, Moon, Note, PaperPlaneRight,
  Person, PersonSimple, Phone, PhoneCall, Rocket, Rows, Shield, Sparkle, Stack,
  Star, StarFour, Sun, Tag, Target, Timer, Trophy, TrendUp, UserCircle, UserFocus,
  Users, Wallet, YoutubeLogo, ChatDots, ChatCircle, ArrowsDownUp, Gauge, Graph,
  Coins,
};

const ICON_NAMES = Object.keys(ICON_MAP);

export const ICON_COLORS = [
  { name: 'Gray',    value: '#9ca3af' },
  { name: 'Red',     value: '#ef4444' },
  { name: 'Orange',  value: '#f97316' },
  { name: 'Amber',   value: '#f59e0b' },
  { name: 'Green',   value: '#10b981' },
  { name: 'Teal',    value: '#06b6d4' },
  { name: 'Blue',    value: '#02AAEB' },
  { name: 'Indigo',  value: '#6366f1' },
  { name: 'Violet',  value: '#8b5cf6' },
  { name: 'Pink',    value: '#ec4899' },
];

export const DEFAULT_ICON_COLOR = '#02AAEB';

function calcPosition(rect: DOMRect) {
  const PICKER_W = 340;
  const PICKER_H = 420;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = rect.bottom + 6;
  let left = rect.left;

  if (left + PICKER_W > vw - 8) left = Math.max(8, vw - PICKER_W - 8);
  if (top + PICKER_H > vh - 8) top = Math.max(8, rect.top - PICKER_H - 6);

  return { top, left };
}

type Props = {
  anchorRect: DOMRect;
  selectedIcon: string | null;
  selectedColor: string | null;
  onSelect: (iconId: string, color: string) => void;
  onRemove: () => void;
  onClose: () => void;
};

export function IconPickerPopover({
  anchorRect,
  selectedIcon,
  selectedColor,
  onSelect,
  onRemove,
  onClose,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [color, setColor] = useState(selectedColor ?? DEFAULT_ICON_COLOR);
  const { top, left } = calcPosition(anchorRect);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) onClose();
    }
    const timer = setTimeout(() => window.addEventListener('mousedown', handler), 60);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousedown', handler);
    };
  }, [onClose]);

  const filtered = query.trim()
    ? ICON_NAMES.filter((n) => n.toLowerCase().includes(query.toLowerCase().trim()))
    : ICON_NAMES;

  return (
    <div ref={wrapRef} className={styles.wrap} style={{ top, left }}>
      <div className={styles.toolbar}>
        <span className={styles.toolbarTitle}>Choose an icon</span>
        {(selectedIcon) && (
          <button type="button" className={styles.removeBtn} onClick={onRemove}>
            Remove
          </button>
        )}
      </div>

      <div className={styles.colorRow}>
        {ICON_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            className={`${styles.colorSwatch} ${color === c.value ? styles.colorSwatchActive : ''}`}
            style={{ '--swatch-color': c.value } as React.CSSProperties}
            title={c.name}
            onClick={() => setColor(c.value)}
            aria-label={c.name}
          />
        ))}
      </div>

      <div className={styles.searchWrap}>
        <MagnifyingGlass size={13} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Filter icons…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      <div className={styles.grid}>
        {filtered.length === 0 ? (
          <span className={styles.empty}>No icons found</span>
        ) : (
          filtered.map((name) => {
            const IconComp = ICON_MAP[name];
            const isSelected = name === selectedIcon;
            return (
              <button
                key={name}
                type="button"
                title={name}
                aria-label={name}
                className={`${styles.iconBtn} ${isSelected ? styles.iconBtnSelected : ''}`}
                style={isSelected ? { '--icon-color': color } as React.CSSProperties : undefined}
                onClick={() => onSelect(name, color)}
              >
                <IconComp size={18} weight="regular" color={isSelected ? color : undefined} />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export function ViewIcon({
  iconId,
  iconColor,
  size = 14,
}: {
  iconId: string | null | undefined;
  iconColor?: string | null;
  size?: number;
}) {
  if (!iconId) return null;
  const IconComp = ICON_MAP[iconId];
  if (!IconComp) return null;
  return <IconComp size={size} weight="regular" color={iconColor ?? DEFAULT_ICON_COLOR} />;
}
