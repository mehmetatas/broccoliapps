import { type PillItem, Pills } from "@broccoliapps/mobile";

export type ProjectFilter = "active" | "archived";

const filterOptions: PillItem<ProjectFilter>[] = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

type Props = {
  selected: ProjectFilter;
  onSelect: (filter: ProjectFilter) => void;
};

export const FilterPills = ({ selected, onSelect }: Props) => {
  return <Pills items={filterOptions} selected={selected} onSelect={onSelect} />;
};
