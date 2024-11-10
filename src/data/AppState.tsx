import React, {
  FC,
  ReactNode,
  createContext,
  useContext,
  useState,
} from 'react';
import MightDeckOrganizer, {
  MightCardsSelection,
  defaultMightCardsSelection,
} from './MightDeckOrganizer';
import MightCard from './MightCard';

interface AppState {
  isEncounter: boolean;
  encounterDeck: MightDeckOrganizer;
  oathswornDeck: MightDeckOrganizer;
  selections: MightCardsSelection;
  drawResults: MightCard[][];
}

interface AppActions {
  toggleDeck: () => void;
  resetSelections: () => void;
  setSelections: (selections: MightCardsSelection) => void;
  confirmDraw: () => void;
  discardDrawResults: () => void;
  confirmDrawCriticals: () => void;
}

interface AppStateContextProps {
  state: AppState;
  actions: AppActions;
  updateState: (newState: Partial<AppState>) => void;
}

const createDefaultAppState = (): AppState => ({
  isEncounter: false,
  encounterDeck: new MightDeckOrganizer(true),
  oathswornDeck: new MightDeckOrganizer(true),
  selections: { ...defaultMightCardsSelection },
  drawResults: [],
});

const AppStateContext = createContext<AppStateContextProps | undefined>(
  undefined,
);

export const AppStateProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => createDefaultAppState());

  const updateState = (newState: Partial<AppState>) => {
    setState((prevState) => ({ ...prevState, ...newState }));
  };

  const actions = {
    toggleDeck: () =>
      setState((prev) => ({
        ...prev,
        isEncounter: !prev.isEncounter,
      })),

    resetSelections: () =>
      setState((prev) => ({
        ...prev,
        selections: { ...defaultMightCardsSelection },
      })),

    setSelections: (selections: MightCardsSelection) =>
      setState((prev) => ({
        ...prev,
        selections,
      })),

    confirmDraw: () =>
      setState((prev) => {
        const updates = prev.isEncounter
          ? prev.encounterDeck.clone()
          : prev.oathswornDeck.clone();
        const drawResults = [
          ...updates.white.drawN(prev.selections.white),
          ...updates.yellow.drawN(prev.selections.yellow),
          ...updates.red.drawN(prev.selections.red),
          ...updates.black.drawN(prev.selections.black),
        ];

        console.log('draw results', drawResults);
        return {
          ...prev,
          [prev.isEncounter ? 'encounterDeck' : 'oathswornDeck']: updates,
          drawResults: [drawResults, ...prev.drawResults],
          selections: { ...defaultMightCardsSelection },
        };
      }),

    confirmDrawCriticals: () =>
      setState((prev) => {
        console.log('confirmDrawCriticals', prev);
        const newCriticals = prev.drawResults[0].filter((v) => v.critical);
        const selections = newCriticals.reduce((acc, card) => ({
          ...acc,
          [card.color]: acc[card.color] + 1
        }), { ...defaultMightCardsSelection });

        return {
          ...prev,
          selections,
        }
      }),

    discardDrawResults: () =>
      setState((prev) => {
        const updates = prev.isEncounter
          ? prev.encounterDeck.clone()
          : prev.oathswornDeck.clone();
          updates.white.discardDisplay();
          updates.yellow.discardDisplay();
          updates.red.discardDisplay();
          updates.black.discardDisplay();

        return{
          ...prev,
          drawResults: [],
          [prev.isEncounter ? 'encounterDeck' : 'oathswornDeck']: updates
        }
      })

  };

  return (
    <AppStateContext.Provider value={{ state, actions, updateState }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = (): AppStateContextProps => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within a AppStateProvider');
  }
  return context;
};
