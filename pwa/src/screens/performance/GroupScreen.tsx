import type { UnitGroup, UnitLeaf } from "@eios/contracts";
import { UnitCard } from "./PerformanceTab.js";
import { SubHeader } from "../../shell/SubHeader.js";

interface Props {
  group:  UnitGroup;
  onBack: () => void;
  onUnit: (unit: UnitLeaf) => void;
}

export function GroupScreen({ group, onBack, onUnit }: Props) {
  return (
    <>
      <SubHeader title={`${group.code} · ${group.title}`} onBack={onBack} />

      <div className="flex-1 px-4 py-3 overflow-y-auto pt-4">
        {group.children.map(child => (
          <UnitCard
            key={child.unitId}
            unit={child}
            showCode
            onClick={() => onUnit(child)}
          />
        ))}
      </div>
    </>
  );
}
