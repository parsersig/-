"use client";

import type { FC } from 'react';
import * as React from 'react'; // Ensure React is imported for React.cloneElement
import { CheckCircle2, XCircle, Timer, Loader2, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusIconType = 'idle' | 'active' | 'loading' | 'success' | 'error';

interface StatusIndicatorProps {
  iconType: StatusIconType;
  text: string;
  colorClassName: string;
  triggerAnimation: 'success' | 'none';
}

const StatusIndicator: FC<StatusIndicatorProps> = ({ iconType, text, colorClassName, triggerAnimation }) => {
  let iconElement: React.ReactElement;

  switch (iconType) {
    case 'loading':
      iconElement = <Loader2 className="w-5 h-5 animate-spin" />;
      break;
    case 'success':
      iconElement = <CheckCircle2 className="w-5 h-5" />;
      break;
    case 'error':
      iconElement = <XCircle className="w-5 h-5" />;
      break;
    case 'active':
      iconElement = <Timer className="w-5 h-5" />;
      break;
    case 'idle':
    default:
      iconElement = <Bot className="w-5 h-5" />; // Using Bot icon for idle
      break;
  }

  return (
    <div className={cn("flex items-center space-x-2", colorClassName, triggerAnimation === 'success' ? 'animate-success-ping' : '')}>
      {React.cloneElement(iconElement, { className: cn(iconElement.props.className, colorClassName) })}
      <span>{text}</span>
    </div>
  );
};

export default StatusIndicator;
