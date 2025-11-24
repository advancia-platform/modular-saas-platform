import React from 'react';
import { ProjectResponse } from '../types/models';

interface Props {
  project: ProjectResponse;
}

export function ProjectCard({ project }: Props) {
  return (
    <div style={wrapper}>
      <h3 style={{ margin: '0 0 0.25rem' }}>{project.name}</h3>
      {project.description && <p style={{ margin: 0 }}>{project.description}</p>}
      <div style={metaRow}>
        <span>Status: {project.status || 'n/a'}</span>
        {project.startDate && (
          <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>
        )}
        {project.endDate && <span>End: {new Date(project.endDate).toLocaleDateString()}</span>}
      </div>
    </div>
  );
}

const wrapper: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: 6,
  padding: '0.75rem',
  background: '#fafafa',
  marginBottom: '0.75rem',
};

const metaRow: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  fontSize: '0.75rem',
  marginTop: '0.5rem',
  color: '#555',
};

export default ProjectCard;
