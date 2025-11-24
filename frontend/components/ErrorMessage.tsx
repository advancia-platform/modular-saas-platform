interface Props {
  error?: string | null;
}

export function ErrorMessage({ error }: Props) {
  if (!error) return null;
  return (
    <div style={{ padding: '0.75rem', background: '#ffe5e5', color: '#800', borderRadius: 4 }}>
      <strong>Error:</strong> {error}
    </div>
  );
}

export default ErrorMessage;
