import type { CSSProperties } from 'react';
import {
  ArrowRight,
  Bell,
  BookOpen,
  Camera,
  Check,
  ChefHat,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Heart,
  LayoutDashboard,
  Leaf,
  Mic,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  Refrigerator,
  Search,
  Settings,
  ShoppingCart,
  Snowflake,
  Sparkles,
  SlidersHorizontal,
  Trash2,
  User,
  X,
} from 'lucide-react';

/* Curated lucide set — add icons here as board sections need them, never import the
   full icon barrel (bundle size). Stroke width 1.6 is the Kitchen OS spec. */
const iconMap = {
  ArrowRight,
  Bell,
  BookOpen,
  Camera,
  Check,
  ChefHat,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Heart,
  LayoutDashboard,
  Leaf,
  Mic,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  Refrigerator,
  Search,
  Settings,
  ShoppingCart,
  Snowflake,
  Sparkles,
  SlidersHorizontal,
  Trash2,
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
