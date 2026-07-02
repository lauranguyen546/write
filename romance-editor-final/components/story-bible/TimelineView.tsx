interface TimelineViewProps {
  events: string[];
}

export default function TimelineView({ events }: TimelineViewProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-gray-500">No timeline events detected yet.</p>
    );
  }

  return (
    <ol className="relative border-l-2 border-romance-200 ml-3 space-y-5">
      {events.map((event, idx) => (
        <li key={idx} className="ml-5">
          <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-romance-500 ring-4 ring-white text-[8px] text-white font-bold">
            {idx + 1}
          </span>
          <p className="text-sm text-gray-700">{event}</p>
        </li>
      ))}
    </ol>
  );
}
