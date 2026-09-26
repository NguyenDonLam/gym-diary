import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type SectionRailItem = {
  id: string;
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
};
type Registry = Record<string, SectionRailItem[]>;
const ItemsContext = createContext<Registry>({});
const RegisterContext = createContext<
  (section: string, items: SectionRailItem[] | null) => void
>(() => {});

export function SectionRailProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<Registry>({});
  const register = useCallback(
    (section: string, next: SectionRailItem[] | null) => {
      setItems((previous) => {
        const updated = { ...previous };
        if (next) updated[section] = next;
        else delete updated[section];
        return updated;
      });
    },
    [],
  );
  return (
    <RegisterContext.Provider value={register}>
      <ItemsContext.Provider value={items}>{children}</ItemsContext.Provider>
    </RegisterContext.Provider>
  );
}

// Screens retain ownership of queries and selection. Only prepared navigation
// items are shared with the rail; callbacks always use the latest screen state.
export function useSectionRail(section: string, items: SectionRailItem[]) {
  const register = useContext(RegisterContext);
  const latest = useRef(items);
  useEffect(() => {
    latest.current = items;
  });
  const signature = JSON.stringify(
    items.map(({ onPress: _, ...item }) => item),
  );
  useEffect(() => {
    const metadata = JSON.parse(signature) as Omit<
      SectionRailItem,
      "onPress"
    >[];
    register(
      section,
      metadata.map((item) => ({
        ...item,
        onPress: () =>
          latest.current.find((current) => current.id === item.id)?.onPress(),
      })),
    );
    return () => register(section, null);
  }, [register, section, signature]);
}

export function useSectionRailItems(section: string) {
  return useContext(ItemsContext)[section] ?? [];
}
