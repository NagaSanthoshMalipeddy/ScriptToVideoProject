export type Word = {
  word: string;
  start: number;
  end: number;
};

export type Section = {
  text: string;
  start: number;
  end: number;
  words: Word[];
};

export type Timing = {
  audio: string;
  durationSec: number;
  sections: Section[];
};

export type Theme = {
  background: string;
  ink: string;
  accent: string;
  font: string;
};
