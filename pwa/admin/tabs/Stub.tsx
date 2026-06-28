import { Card } from "../../src/ui/Card.js";

interface Props {
  title:       string;
  description: string;
  todo:        string;
}

export function Stub({ title, description, todo }: Props) {
  return (
    <div className="py-4 space-y-4">
      <div>
        <h2 className="text-fg text-base font-semibold">{title}</h2>
        <p className="text-fg-muted text-sm mt-1">{description}</p>
      </div>
      <Card className="p-6 text-center">
        <div className="text-3xl mb-2">🚧</div>
        <div className="text-fg text-sm font-medium mb-1">В разработке</div>
        <div className="text-fg-muted text-xs">{todo}</div>
      </Card>
    </div>
  );
}
