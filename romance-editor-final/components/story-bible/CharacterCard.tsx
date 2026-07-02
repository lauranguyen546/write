interface CharacterCardProps {
  name: string;
  role: string;
  traits: string[];
  arc: string;
}

const ROLE_COLORS: Record<string, string> = {
  protagonist: 'bg-romance-100 text-romance-800',
  'love interest': 'bg-pink-100 text-pink-800',
  antagonist: 'bg-red-100 text-red-800',
  supporting: 'bg-blue-100 text-blue-800',
};

function roleColor(role: string): string {
  const key = role.toLowerCase();
  for (const [match, classes] of Object.entries(ROLE_COLORS)) {
    if (key.includes(match)) return classes;
  }
  return 'bg-gray-100 text-gray-800';
}

export default function CharacterCard({ name, role, traits, arc }: CharacterCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColor(role)}`}>
          {role}
        </span>
      </div>

      {traits.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {traits.map((trait, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
            >
              {trait}
            </span>
          ))}
        </div>
      )}

      {arc && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Character Arc</p>
          <p className="text-sm text-gray-700">{arc}</p>
        </div>
      )}
    </div>
  );
}
