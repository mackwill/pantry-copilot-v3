import {
  Apple,
  Archive,
  ArrowRight,
  AtSign,
  Beef,
  Camera,
  Check,
  ChefHat,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cookie,
  Flame,
  Heart,
  House,
  Image as ImageIcon,
  Leaf,
  Lock,
  MessageSquare,
  Mic,
  Milk,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  Refrigerator,
  ScanLine,
  Search,
  Settings,
  SlidersHorizontal,
  Snowflake,
  Sparkles,
  Trash2,
  User,
  Wheat,
  Wine,
  X,
  Zap,
  // The package root barrel is broken in 1.17.0 (re-exports a LucideProvider
  // that context.mjs never defines); the /icons subpath sidesteps it.
} from 'lucide-react-native/icons';
import type { ComponentType } from 'react';
import { tokens } from '../../tokens/native.js';
import { Chrome } from './Chrome.js';

export type IconName =
  | 'Apple'
  | 'Archive'
  | 'ArrowRight'
  | 'AtSign'
  | 'Beef'
  | 'Camera'
  | 'Check'
  | 'ChefHat'
  | 'ChevronDown'
  | 'ChevronLeft'
  | 'ChevronRight'
  | 'Chrome'
  | 'Clock'
  | 'Cookie'
  | 'Flame'
  | 'Heart'
  | 'House'
  | 'Image'
  | 'Leaf'
  | 'Lock'
  | 'MessageSquare'
  | 'Mic'
  | 'Milk'
  | 'Minus'
  | 'Pencil'
  | 'Plus'
  | 'RefreshCw'
  | 'Refrigerator'
  | 'ScanLine'
  | 'Search'
  | 'Settings'
  | 'SlidersHorizontal'
  | 'Snowflake'
  | 'Sparkles'
  | 'Trash2'
  | 'User'
  | 'Wheat'
  | 'Wine'
  | 'X'
  | 'Zap';

interface RenderedIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  testID?: string;
}

const iconMap: Record<IconName, ComponentType<RenderedIconProps>> = {
  Apple,
  Archive,
  ArrowRight,
  AtSign,
  Beef,
  Camera,
  Check,
  ChefHat,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Chrome,
  Clock,
  Cookie,
  Flame,
  Heart,
  House,
  Image: ImageIcon,
  Leaf,
  Lock,
  MessageSquare,
  Mic,
  Milk,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  Refrigerator,
  ScanLine,
  Search,
  Settings,
  SlidersHorizontal,
  Snowflake,
  Sparkles,
  Trash2,
  User,
  Wheat,
  Wine,
  X,
  Zap,
};

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  testID?: string;
}

// No CSS color inheritance on native — default to the design foreground
// instead of the web Icon's `currentColor`.
export function Icon({
  name,
  size = 18,
  color = tokens.fg,
  strokeWidth = 1.6,
  testID,
}: IconProps) {
  const LucideIcon = iconMap[name];
  return (
    <LucideIcon
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      {...(testID === undefined ? {} : { testID })}
    />
  );
}
