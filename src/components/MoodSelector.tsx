'use client';

import { MoonPhase, MOOD_MAPPINGS } from '@/types/diary';
import { motion } from 'framer-motion';

interface MoodSelectorProps {
  selectedMood: MoonPhase | null;
  onSelect: (mood: MoonPhase) => void;
}

export default function MoodSelector({ selectedMood, onSelect }: MoodSelectorProps) {
  const moods: MoonPhase[] = ['new', 'waxing', 'full', 'waning'];

  return (
    <div className="grid grid-cols-2 gap-3">
      {moods.map((mood) => {
        const mapping = MOOD_MAPPINGS[mood];
        const isSelected = selectedMood === mood;

        return (
          <motion.button
            key={mood}
            onClick={() => onSelect(mood)}
            className={`
              p-5 rounded-lg border transition-all text-left
              ${isSelected 
                ? 'border-[var(--text-primary)] bg-[var(--bg-secondary)]' 
                : 'border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--text-secondary)]'
              }
            `}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="text-4xl mb-2">{mapping.emoji}</div>
            <div className="font-semibold text-base mb-0.5">{mapping.name}</div>
            <div className="text-xs text-[var(--text-secondary)]">{mapping.description}</div>
          </motion.button>
        );
      })}
    </div>
  );
}

