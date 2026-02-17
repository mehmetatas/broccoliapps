import { type PillItem, Pills } from "@broccoliapps/mobile";
import { useMemo } from "react";

type Props = {
  options: readonly number[];
  selected: number;
  onSelect: (value: number) => void;
  suffix?: string;
};

export const DurationPicker = ({ options, selected, onSelect, suffix = "min" }: Props) => {
  const items = useMemo<PillItem<string>[]>(
    () =>
      options.map((option) => ({
        value: String(option),
        label: `${option} ${suffix}`,
      })),
    [options, suffix],
  );

  const handleSelect = (value: string) => {
    onSelect(Number(value));
  };

  return <Pills items={items} selected={String(selected)} onSelect={handleSelect} />;
};
