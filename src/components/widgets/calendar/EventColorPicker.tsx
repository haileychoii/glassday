/**
 * [Figma Mapping] Calendar / Event Color Swatch Picker
 * Parent: src/components/widgets/CalendarWidget.tsx의 Event Detail Form
 * Data: src/constants/colors.ts의 pastelEventColors
 * Figma Component Set: Color Swatch / Default · Selected
 * value는 CalendarEvent.color에 저장되어 theme과 독립적으로 유지된다.
 */
import { Check } from "lucide-react";

import { pastelEventColors } from "../../../constants/colors";
import { cn } from "../../../lib/utils";

type EventColorPickerProps = {
  value?: string;
  onChange: (color: string) => void;
};

/** Event detail이 제어하는 controlled color picker. */
export const EventColorPicker = ({ value, onChange }: EventColorPickerProps) => {
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
    </div>
  );
};
