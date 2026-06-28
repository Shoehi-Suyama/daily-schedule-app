import { useState } from 'react';
import type { Task } from '../types';

interface Props {
  tasks: Task[];
  onChange: (tasks: Task[]) => void;
}

export default function TaskList({ tasks, onChange }: Props) {
  const [newTitle, setNewTitle] = useState('');

  function toggle(id: string) {
    onChange(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  function add() {
    const title = newTitle.trim();
    if (!title) return;
    onChange([...tasks, { id: Date.now().toString(), title, done: false }]);
    setNewTitle('');
  }

  function remove(id: string) {
    onChange(tasks.filter(t => t.id !== id));
  }

  return (
    <div className="bg-white rounded-xl mx-3 my-2 shadow-sm p-3">
      <h2 className="text-sm font-semibold text-gray-700 mb-2">タスク</h2>
      <ul className="space-y-1">
        {tasks.map(t => (
          <li key={t.id} className="flex items-center gap-2">
            <button
              onClick={() => toggle(t.id)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${t.done ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}
            >
              {t.done && <span className="text-white text-xs">✓</span>}
            </button>
            <span className={`flex-1 text-sm ${t.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.title}</span>
            <button onClick={() => remove(t.id)} className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="タスクを追加..."
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400"
        />
        <button onClick={add} className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">追加</button>
      </div>
    </div>
  );
}
