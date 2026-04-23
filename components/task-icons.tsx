import type { TaskIconName } from "@/lib/morning-quest";
import {
  PiBarbellFill,
  PiDropFill,
  PiForkKnifeFill,
  PiShirtFoldedFill,
} from "react-icons/pi";

type TaskIconProps = {
  icon: TaskIconName;
  className?: string;
};

export function TaskIcon({ icon, className }: TaskIconProps) {
  const iconClassName = className
    ? `task-visual-icon ${className}`
    : "task-visual-icon";

  if (icon === "shirt") {
    return <PiShirtFoldedFill aria-hidden="true" className={iconClassName} />;
  }

  if (icon === "plate") {
    return <PiForkKnifeFill aria-hidden="true" className={iconClassName} />;
  }

  if (icon === "drop") {
    return <PiDropFill aria-hidden="true" className={iconClassName} />;
  }

  return <PiBarbellFill aria-hidden="true" className={iconClassName} />;
}
