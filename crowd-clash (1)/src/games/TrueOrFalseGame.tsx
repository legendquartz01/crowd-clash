import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { BadgeCheck, Check, Flame, X } from 'lucide-react';
import type { MiniGameProps } from '../types/game';

interface TriviaItem {
  statement: string;
  answer: boolean;
  category: string;
}

// 48 varied, accurate, fast-to-read trivia & general knowledge statements
const TRIVIA_BANK: readonly TriviaItem[] = [
  { statement: 'Honey never spoils when stored in a sealed jar.', answer: true, category: 'Food' },
  { statement: 'Bananas grow on trees.', answer: false, category: 'Nature' },
  { statement: 'An octopus has three hearts.', answer: true, category: 'Animals' },
  { statement: 'Lightning never strikes the same place twice.', answer: false, category: 'Science' },
  { statement: 'Venus is the hottest planet in our solar system.', answer: true, category: 'Space' },
  { statement: 'Goldfish only have a 3-second memory.', answer: false, category: 'Animals' },
  { statement: 'A day on Venus is longer than a year on Venus.', answer: true, category: 'Space' },
  { statement: 'Mount Everest is the tallest mountain in Europe.', answer: false, category: 'Geography' },
  { statement: 'Sharks have no bones in their bodies.', answer: true, category: 'Animals' },
  { statement: 'The Great Wall of China is visible from the Moon with the naked eye.', answer: false, category: 'History' },
  { statement: 'Strawberries are botanically not berries, while bananas are.', answer: true, category: 'Food' },
  { statement: 'Sound travels faster in air than in water.', answer: false, category: 'Physics' },
  { statement: 'Japan consists of more than 6,000 islands.', answer: true, category: 'Geography' },
  { statement: 'Penguins naturally live in the Arctic North Pole.', answer: false, category: 'Animals' },
  { statement: 'A group of flamingos is called a flamboyance.', answer: true, category: 'Animals' },
  { statement: 'Humans use only 10% of their brains.', answer: false, category: 'Science' },
  { statement: 'Water boils at a lower temperature on top of a high mountain.', answer: true, category: 'Science' },
  { statement: 'Australia is wider than the diameter of the Moon.', answer: true, category: 'Geography' },
  { statement: 'Bats are completely blind.', answer: false, category: 'Animals' },
  { statement: 'The Eiffel Tower grows taller in the summer heat.', answer: true, category: 'Science' },
  { statement: 'Albert Einstein won the Nobel Prize for the theory of relativity.', answer: false, category: 'History' },
  { statement: 'Cleopatra lived closer in time to the iPhone than to the Great Pyramid.', answer: true, category: 'History' },
  { statement: 'Spiders are classified as insects.', answer: false, category: 'Nature' },
  { statement: 'Diamonds are made purely of carbon atoms.', answer: true, category: 'Science' },
  { statement: 'The Sahara is the largest desert on Earth by area.', answer: false, category: 'Geography' },
  { statement: 'A bolt of lightning is hotter than the surface of the Sun.', answer: true, category: 'Science' },
  { statement: 'Tomatoes are native to Italy.', answer: false, category: 'Food' },
  { statement: 'Your nose and ears continue to change shape throughout your life.', answer: true, category: 'Biology' },
  { statement: 'Dolphins are fish.', answer: false, category: 'Animals' },
  { statement: 'Iceland has zero mosquitoes in the wild.', answer: true, category: 'Geography' },
  { statement: 'The first computer mouse was made of wood.', answer: true, category: 'Tech' },
  { statement: 'HTTP stands for HyperText Transfer Protocol.', answer: true, category: 'Tech' },
  { statement: 'Java and JavaScript were designed as the same programming language.', answer: false, category: 'Tech' },
  { statement: 'A standard chess board has 64 squares.', answer: true, category: 'Games' },
  { statement: 'In bowling, three strikes in a row is called a turkey.', answer: true, category: 'Sports' },
  { statement: 'A soccer match has four quarters of 20 minutes.', answer: false, category: 'Sports' },
  { statement: 'Koalas have fingerprints nearly identical to humans.', answer: true, category: 'Animals' },
  { statement: 'The Atlantic Ocean is larger than the Pacific Ocean.', answer: false, category: 'Geography' },
  { statement: 'Mars has two moons named Phobos and Deimos.', answer: true, category: 'Space' },
  { statement: 'Peanuts are true tree nuts.', answer: false, category: 'Food' },
  { statement: 'Crows can recognize and remember individual human faces.', answer: true, category: 'Animals' },
  { statement: 'The human body has 206 bones in adulthood.', answer: true, category: 'Biology' },
  { statement: 'Camels store liquid water inside their humps.', answer: false, category: 'Animals' },
  { statement: 'Oxford University is older than the Aztec Empire.', answer: true, category: 'History' },
  { statement: 'Mercury is the closest planet to the Sun.', answer: true, category: 'Space' },
  { statement: 'Chameleons change color exclusively to camouflage with backgrounds.', answer: false, category: 'Animals' },
  { statement: 'The speed of light is faster than the speed of sound.', answer: true, category: 'Physics' },
  { statement: 'A leap year occurs every five years.', answer: false, category: 'General' },
];

function shuffleBank(): TriviaItem[] {
  const arr = [...TRIVIA_BANK];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function TrueOrFalseGame({ onScore, isActive }: MiniGameProps) {
  const [deck, setDeck] = useState<TriviaItem[]>(() => shuffleBank());
  const [index, setIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    label: string;
    token: number;
  } | null>(null);

  const tokenRef = useRef(1);
  const clearTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current !== null) {
        clearTimeout(clearTimerRef.current);
      }
    };
  }, []);

  const current = deck[index % deck.length];

  const handleAnswer = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>, choice: boolean) => {
      e.preventDefault();
      if (!isActive) return;

      if (clearTimerRef.current !== null) {
        clearTimeout(clearTimerRef.current);
      }

      if (choice === current.answer) {
        const nextStreak = streak + 1;
        const pts = 10 + Math.min(nextStreak - 1, 4) * 5;
        setStreak(nextStreak);
        onScore(pts);
        setFeedback({
          ok: true,
          label: nextStreak >= 3 ? `+${pts} STREAK!` : `+${pts}`,
          token: ++tokenRef.current,
        });
      } else {
        setStreak(0);
        onScore(-5);
        setFeedback({
          ok: false,
          label: '-5',
          token: ++tokenRef.current,
        });
      }

      clearTimerRef.current = window.setTimeout(() => {
        setFeedback(null);
        clearTimerRef.current = null;
      }, 320);

      const nextIdx = index + 1;
      if (nextIdx >= deck.length) {
        setDeck(shuffleBank());
        setIndex(0);
      } else {
        setIndex(nextIdx);
      }
    },
    [current.answer, deck.length, index, isActive, onScore, streak]
  );

  return (
    <div className="flex h-full w-full flex-col items-center justify-between gap-3.5 py-1 select-none">
      {/* Dark Arcade Header */}
      <div className="flex w-full max-w-md items-center justify-between rounded-2xl border border-white/10 bg-[#121620] px-4 py-2.5 text-white shadow-lg">
        <div className="flex items-center gap-2 text-xs font-extrabold tracking-[0.14em] text-slate-200 uppercase">
          <BadgeCheck className="h-4 w-4 text-emerald-400" />
          <span>{current.category}</span>
        </div>
        <div
          className={`font-mono-num inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold ${
            streak >= 3
              ? 'bg-amber-400 text-slate-950'
              : streak >= 1
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-white/8 text-slate-400'
          }`}
        >
          <Flame className="h-3.5 w-3.5" />
          <span>Streak {streak}</span>
        </div>
      </div>

      {/* Trivia Statement Card */}
      <div
        key={feedback && !feedback.ok ? `miss-${feedback.token}` : 'tf-card'}
        className={`relative flex w-full max-w-md flex-1 flex-col items-center justify-center rounded-3xl border-2 bg-[#0E1118] p-6 text-center text-white shadow-2xl transition-colors duration-150 ${
          feedback?.ok
            ? 'border-emerald-400 bg-emerald-950/30'
            : feedback && !feedback.ok
              ? 'animate-shake border-rose-500 bg-rose-950/35'
              : 'border-white/12'
        }`}
      >
        <span className="text-[11px] font-extrabold tracking-[0.22em] text-slate-400 uppercase">
          True or False?
        </span>
        <p className="font-display mt-4 text-2xl leading-snug font-bold text-white sm:text-3xl">
          {current.statement}
        </p>

        {feedback && (
          <div
            key={feedback.token}
            className={`animate-chip-pop pointer-events-none absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full px-3.5 py-1 text-xs font-extrabold shadow-lg ${
              feedback.ok ? 'bg-emerald-400 text-slate-950' : 'bg-rose-500 text-white'
            }`}
          >
            {feedback.ok ? (
              <Check className="h-3.5 w-3.5 stroke-[3]" />
            ) : (
              <X className="h-3.5 w-3.5 stroke-[3]" />
            )}
            <span className="font-mono-num">{feedback.label}</span>
          </div>
        )}
      </div>

      {/* Giant TRUE (Green) & FALSE (Red) Buttons */}
      <div className="grid w-full max-w-md grid-cols-2 gap-3.5">
        <button
          id="tf-btn-true"
          type="button"
          disabled={!isActive}
          onPointerDown={(e) => handleAnswer(e, true)}
          className="font-display flex flex-col items-center justify-center gap-1 rounded-2xl border-b-4 border-emerald-800 bg-emerald-500 py-7 text-2xl font-bold tracking-wide text-slate-950 shadow-lg transition-transform duration-75 hover:bg-emerald-400 active:translate-y-0.5 active:scale-[0.96] disabled:opacity-50"
        >
          <Check className="h-7 w-7 stroke-[3]" />
          <span>TRUE</span>
        </button>

        <button
          id="tf-btn-false"
          type="button"
          disabled={!isActive}
          onPointerDown={(e) => handleAnswer(e, false)}
          className="font-display flex flex-col items-center justify-center gap-1 rounded-2xl border-b-4 border-rose-900 bg-[#E63946] py-7 text-2xl font-bold tracking-wide text-white shadow-lg transition-transform duration-75 hover:bg-[#F04452] active:translate-y-0.5 active:scale-[0.96] disabled:opacity-50"
        >
          <X className="h-7 w-7 stroke-[3]" />
          <span>FALSE</span>
        </button>
      </div>
    </div>
  );
}
