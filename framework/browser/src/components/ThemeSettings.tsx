import { setTheme as saveTheme, type Theme } from "../theme";

type ThemeSettingsProps = {
  value: Theme;
  onChange: (theme: Theme) => void;
};

export const ThemeSettings = ({ value, onChange }: ThemeSettingsProps) => {
  const handleChange = (newTheme: Theme) => {
    onChange(newTheme);
    saveTheme(newTheme);
  };

  return (
    <div>
      <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Theme</label>
      <div class="flex gap-2">
        {(["system", "light", "dark"] as Theme[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => handleChange(option)}
            class={`px-4 py-2 text-sm rounded-md border ${
              value === option
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-600"
            }`}
          >
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};
