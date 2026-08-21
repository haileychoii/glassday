/**
 * [Figma Mapping] Calendar / Event Color Swatch Picker
 * Parent: src/components/widgets/CalendarWidget.tsx의 Event Detail Form
 * Data: src/constants/colors.ts의 pastelEventColors
 * Figma Component Set: Color Swatch / Default · Selected
 * value는 CalendarEvent.color에 저장되어 theme과 독립적으로 유지된다.
 */
import { Check, Plus } from "lucide-react";

import { pastelEventColors } from "../../../constants/colors";
import { cn } from "../../../lib/utils";

type EventColorPickerProps = {
  value?: string;
  onChange: (color: string) => void;
};

/** Event detail이 제어하는 controlled color picker. */
export const EventColorPicker = ({ value, onChange }: EventColorPickerProps) => {
  const normalizedValue = value?.startsWith("#") ? value : "#BFD8FF";

  const handleHexChange = (nextValue: string) => {
    const normalized = nextValue.trim();

    if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
      onChange(normalized.toUpperCase());
    }
  };

  return (
    <div className="event-color-picker">
      {pastelEventColors.map((color) => (
        <button
          key={color.value}
          type="button"
          onClick={() => onChange(color.value)}
          className={cn(
            "event-color-chip",
            value === color.value && "is-active"
          )}
          style={{ backgroundColor: color.value }}
          title={color.name}
        >
          {value === color.value && <Check className="w-3 h-3" />}
        </button>
      ))}

      <label className="event-color-custom-chip" title="Choose custom color">
        <Plus className="w-3 h-3" />
        <input
          type="color"
          value={normalizedValue}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          aria-label="Choose custom event color"
        />
      </label>

      <label className="event-color-hex-field">
        <span>HEX</span>
        <input
          value={value ?? ""}
          onChange={(event) => handleHexChange(event.target.value)}
          placeholder="#BFD8FF"
          spellCheck={false}
          aria-label="Custom event color hex code"
        />
      </label>
    </div>
  );
};
