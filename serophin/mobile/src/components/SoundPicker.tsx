import { type PillItem, Pills } from "@broccoliapps/mobile";
import { useMemo } from "react";

type Props = {
  sounds: Record<string, string>;
  selected: string;
  onSelect: (value: string) => void;
};

export const SoundPicker = ({ sounds, selected, onSelect }: Props) => {
  const items = useMemo<PillItem<string>[]>(() => Object.entries(sounds).map(([value, label]) => ({ value, label })), [sounds]);

  return <Pills items={items} selected={selected} onSelect={onSelect} transparent />;
};
