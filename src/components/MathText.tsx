// src/components/MathText.tsx

import React from 'react';
import { InlineMath } from 'react-katex';

interface MathTextProps {
  text: string;
  className?: string;
}

// This component splits the text by the '$' delimiter and renders
// the math parts with KaTeX and the text parts normally.
export function MathText({ text, className }: MathTextProps) {
  const parts = text.split('$');

  return (
    <p className={className}>
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          // This part is inside the '$...$' delimiters, so render it as math
          return <InlineMath key={index} math={part} />;
        } else {
          // This is regular text
          return <span key={index}>{part}</span>;
        }
      })}
    </p>
  );
}