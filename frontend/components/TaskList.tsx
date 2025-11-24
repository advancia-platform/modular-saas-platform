import React from 'react';
import { TaskResponse } from '../types/models';
import { PaginationMeta } from '../types/responses';

interface Props {
  tasks: TaskResponse[];
  pagination?: PaginationMeta;
}

export default function TaskList({ tasks, pagination }: Props) {
  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Title</th>
            <th style={th}>Status</th>
            <th style={th}>Assignee</th>
            <th style={th}>Due</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id} style={tr}>
              <td style={td}>{t.title}</td>
              <td style={td}>{t.status}</td>
              <td style={td}>{t.assigneeId || '—'}</td>
              <td style={td}>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</td>
            </tr>
          ))}
          {tasks.length === 0 && (
            <tr>
              <td style={td} colSpan={4}>
                No tasks
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {pagination && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
          Page {pagination.page} / {pagination.totalPages} • {pagination.total} total
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: 'left',
  borderBottom: '1px solid #ccc',
  padding: '0.5rem',
};
const td: React.CSSProperties = { padding: '0.5rem', borderBottom: '1px solid #eee' };
const tr: React.CSSProperties = { background: '#fff' };
