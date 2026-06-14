import type { CSSProperties } from 'react';
import {
  Apple,
  ArrowRight,
  AtSign,
  Bell,
  BookOpen,
  Camera,
  Check,
  ChefHat,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Flame,
  Heart,
  LayoutDashboard,
  Leaf,
  Lock,
  Mic,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  Refrigerator,
  ScanLine,
  Search,
  Settings,
  ShoppingCart,
  Snowflake,
  Sparkles,
  SlidersHorizontal,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import { Chrome } from './Chrome.js';

/* Curated lucide set — add icons here as board sections need them, never import the
   full icon barrel (bundle size). Stroke width 1.6 is the Kitchen OS spec. */
const iconMap = {
  Apple,
  ArrowRight,
  AtSign,
  Bell,
  BookOpen,
  Camera,
  Check,
  ChefHat,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Chrome,
  Clock,
  Filter,
  Flame,
  Heart,
  LayoutDashboard,
  Leaf,
  Lock,
  Mic,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  Refrigerator,
  ScanLine,
  Search,
  Settings,
  ShoppingCart,
  Snowflake,
  Sparkles,
  SlidersHorizontal,
  Trash2,
  Upload,
  User,
  X,
} as const;

export type IconName = keyof typeof iconMap;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: CSSProperties;
}

export function Icon({
  name,
  size = 18,
  color = 'currentColor',
  strokeWidth = 1.6,
  style,
}: IconProps) {
  const LucideIcon = iconMap[name];
  return <LucideIcon size={size} color={color} strokeWidth={strokeWidth} style={style} />;
}
