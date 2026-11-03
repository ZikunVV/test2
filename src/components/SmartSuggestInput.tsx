import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  SuggestionItem,
  SuggestionContext,
  getSmartSuggestions,
  getQuickStarterPhrases,
  applySuggestion,
} from '../utils/textSuggestions';
import { Ticket } from '../types';
import { Sparkles, Zap, BookOpen, X, CornerDownLeft } from 'lucide-react';

export interface SmartSuggestInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  context?: SuggestionContext;
  tickets?: Ticket[];
  showQuickStarters?: boolean;
  onValueChange?: (value: string) => void;
  wrapperClassName?: string;
}

export const SmartSuggestInput: React.FC<SmartSuggestInputProps> = ({
  value = '',
  onChange,
  onValueChange,
  context = 'general',
  tickets = [],
  showQuickStarters = false,
  className = '',
  wrapperClassName = '',
  placeholder,
  ...restProps
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<number>(0);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const stringValue = String(value || '');

  const updateSuggestions = useCallback(
    (text: string, pos: number) => {
      const results = getSmartSuggestions(text, pos, context, tickets);
      setSuggestions(results);
      setSelectedIndex(0);
      setIsOpen(results.length > 0);
    },
    [context, tickets]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    const pos = e.target.selectionStart || newText.length;
    setCursorPos(pos);

    if (onChange) {
      onChange(e);
    }
    if (onValueChange) {
      onValueChange(newText);
    }

    updateSuggestions(newText, pos);
  };

  const handleSelectSuggestion = (suggestion: SuggestionItem) => {
    const el = inputRef.current;
    const currentPos = el ? el.selectionStart || stringValue.length : cursorPos;
    const { newText, newCursorPos } = applySuggestion(
      stringValue,
      currentPos,
      suggestion
    );

    if (onValueChange) {
      onValueChange(newText);
    }
    if (onChange && el) {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;
      if (nativeSetter) {
        nativeSetter.call(el, newText);
        const event = new Event('input', { bubbles: true });
        el.dispatchEvent(event);
      }
    }

    setIsOpen(false);
    setSuggestions([]);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isOpen && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        if (suggestions[selectedIndex]) {
          e.preventDefault();
          handleSelectSuggestion(suggestions[selectedIndex]);
          return;
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        return;
      }
    }

    if (restProps.onKeyDown) {
      restProps.onKeyDown(e);
    }
  };

  const handleQuickStarterClick = (phrase: string) => {
    const newText = phrase;
    if (onValueChange) {
      onValueChange(newText);
    }
    if (onChange && inputRef.current) {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;
      if (nativeSetter) {
        nativeSetter.call(inputRef.current, newText);
        const event = new Event('input', { bubbles: true });
        inputRef.current.dispatchEvent(event);
      }
    }

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newText.length, newText.length);
      }
    }, 10);
  };

  const quickStarters = showQuickStarters
    ? getQuickStarterPhrases(context)
    : [];

  return (
    <div ref={containerRef} className={`relative w-full ${wrapperClassName}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={(e) => {
          setIsFocused(true);
          const pos = e.target.selectionStart || stringValue.length;
          setCursorPos(pos);
          if (stringValue.length >= 2) {
            updateSuggestions(stringValue, pos);
          }
          if (restProps.onFocus) restProps.onFocus(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          if (restProps.onBlur) restProps.onBlur(e);
        }}
        onClick={(e) => {
          const target = e.target as HTMLInputElement;
          const pos = target.selectionStart || 0;
          setCursorPos(pos);
          if (stringValue.length >= 2) {
            updateSuggestions(stringValue, pos);
          }
        }}
        placeholder={placeholder}
        className={className}
        {...restProps}
      />

      {/* Floating Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-2xl border border-purple-200 overflow-hidden animate-in fade-in slide-in-from-top-1">
          <div className="px-3 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 flex items-center justify-between text-[11px] text-purple-900 font-bold select-none">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
              <span>Подсказки (слово / фраза / готовое предложение)</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
                [Tab] или [Enter] — вставить
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                title="Закрыть подсказки"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-purple-50">
            {suggestions.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectSuggestion(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3 py-2 text-xs flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-purple-100/80 text-purple-950 font-bold'
                      : 'hover:bg-purple-50/70 text-slate-800 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {item.type === 'sentence' ? (
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-purple-600 text-white flex items-center gap-1 shadow-2xs">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Предложение</span>
                      </span>
                    ) : item.type === 'phrase' ? (
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500 text-white flex items-center gap-1 shadow-2xs">
                        <Zap className="w-2.5 h-2.5" />
                        <span>Фраза</span>
                      </span>
                    ) : (
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-slate-200 text-slate-700 flex items-center gap-1">
                        <BookOpen className="w-2.5 h-2.5" />
                        <span>Слово</span>
                      </span>
                    )}

                    <span className="truncate">{item.text}</span>
                  </div>

                  <span className="shrink-0 text-[10px] text-purple-600 font-mono opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                    <CornerDownLeft className="w-3 h-3" />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick starter chips */}
      {isFocused && quickStarters.length > 0 && !isOpen && !stringValue && (
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap animate-in fade-in select-none">
          <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-500" />
            <span>Частые варианты:</span>
          </span>
          {quickStarters.map((qs, qIdx) => (
            <button
              key={qIdx}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleQuickStarterClick(qs);
              }}
              className="text-[10px] px-2 py-0.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-semibold transition-colors cursor-pointer"
            >
              + {qs}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
