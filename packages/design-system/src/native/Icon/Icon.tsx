import {
  Archive,
  ArrowRight,
  AtSign,
  Camera,
  Check,
  ChefHat,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Heart,
  House,
  Leaf,
  Lock,
  MessageSquare,
  Mic,
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
  X,
  // The package root barrel is broken in 1.17.0 (re-exports a LucideProvider
  // that context.mjs never defines); the /icons subpath sidesteps it.
} from 'lucide-react-native/icons';
import type { ComponentType } from 'react';
import { tokens } from '../../tokens/native.js';

export type IconName =
  | 'Archive'
  | 'ArrowRight'
  | 'AtSign'
  | 'Camera'
  | 'Check'
  | 'ChefHat'
  | 'ChevronDown'
  | 'ChevronLeft'
  | 'ChevronRight'
  | 'Clock'
  | 'Flame'
  | 'Heart'
  | 'House'
  | 'Leaf'
  | 'Lock'
  | 'MessageSquare'
  | 'Mic'
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
  | 'X';

interface RenderedIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  testID?: string;
}

const iconMap: Record<IconName, ComponentType<RenderedIconProps>> = {
  Archive,
  ArrowRight,
  AtSign,
  Camera,
  Check,
  ChefHat,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Heart,
  House,
  Leaf,
  Lock,
  MessageSquare,
  Mic,
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
  X,
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
