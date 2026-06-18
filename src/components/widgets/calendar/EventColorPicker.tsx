import { Check } from "lucide-react";

import { pastelEventColors } from "../../../constants/colors";
import { cn } from "../../../lib/utils";

type EventColorPickerProps = {
  value?: string;
  onChange: (color: string) => void;
};

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
