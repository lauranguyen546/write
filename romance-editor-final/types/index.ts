// Shared types for the application

export type Subgenre = 
  | 'contemporary'
  | 'historical'
  | 'romantic-suspense'
  | 'paranormal'
  | 'fantasy-romance'
  | 'ya-romance'
  | 'romcom';

export type HeatLevel = 
  | 'sweet'
  | 'closed-door'
  | 'open-door'
  | 'explicit';

export type Trope = 
  | 'enemies-to-lovers'
  | 'friends-to-lovers'
  | 'fake-dating'
  | 'second-chance'
  | 'forced-proximity'
  | 'marriage-of-convenience'
  | 'opposites-attract'
  | 'grumpy-sunshine'
  | 'forbidden-love';

export type POVStyle = 
  | 'first-person'
  | 'third-limited'
  | 'dual-pov'
  | 'multi-pov';

export type TargetTone = 
  | 'lyrical'
  | 'punchy'
  | 'comedic'
  | 'dark';

export interface ProjectSettings {
  subgenre: Subgenre;
  heatLevel: HeatLevel;
  tropes: Trope[];
  povStyle: POVStyle;
  targetTone: TargetTone;
}

export type IssueCategory = 
  | 'developmental'
  | 'character'
  | 'scene'
  | 'line'
  | 'repetition';

export type IssueSeverity = 
  | 'critical'
  | 'major'
  | 'minor'
  | 'suggestion';

export type JobType = 
  | 'analysis'
  | 'rewrite_generation';

export type JobStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed';

export type RevisionStatus = 
  | 'proposed'
  | 'accepted'
  | 'rejected';

export interface StoryBible {
  characters: {
    name: string;
    role: string; // protagonist, love interest, etc.
    traits: string[];
    arc: string;
  }[];
  relationshipStatus: string;
  timeline: string[];
  settings: string[];
  povMap: { [character: string]: string[] }; // character -> scenes
  unresolvedThreads: string[];
}

export interface ArcTracker {
  romanceBeats: {
    beat: string;
    location: string; // chunk or chapter
    present: boolean;
  }[];
  subplotBeats: {
    subplot: string;
    beats: string[];
  }[];
}

export interface HeuristicResult {
  type: string;
  instances: {
    text: string;
    position: number;
    context?: string;
  }[];
}

export interface DiffData {
  added: { value: string; count: number }[];
  removed: { value: string; count: number }[];
  unchanged: { value: string; count: number }[];
}
