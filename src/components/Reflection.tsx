interface Props {
  reflection: string;
  rating: number;
  onReflectionChange: (v: string) => void;
  onRatingChange: (v: number) => void;
}

const RATINGS = [
  { value: 1, label: '😞' },
  { value: 2, label: '😕' },
  { value: 3, label: '😐' },
  { value: 4, label: '😊' },
  { value: 5, label: '😄' },
];

export default function Reflection({ reflection, rating, onReflectionChange, onRatingChange }: Props) {
  return (
    <div className="bg-white rounded-xl mx-3 my-2 shadow-sm p-3">
      <h2 className="text-sm font-semibold text-gray-700 mb-2">今日の振り返り</h2>

      <div className="flex justify-around mb-3">
        {RATINGS.map(r => (
          <button
            key={r.value}
            onClick={() => onRatingChange(r.value === rating ? 0 : r.value)}
            className={`text-2xl transition-transform ${rating === r.value ? 'scale-125' : 'opacity-50 hover:opacity-80'}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <textarea
        value={reflection}
        onChange={e => onReflectionChange(e.target.value)}
        placeholder="今日を振り返って..."
        rows={4}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 resize-none"
      />
    </div>
  );
}
