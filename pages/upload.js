import { useState } from 'react';

export default function UploadPage() {
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const file = e.target.file.files[0];
    const fd = new FormData();
    fd.append('file', file);
    fd.append('user_id', 'ui-user');
    fd.append('category', 'demo');

    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    setStatus(JSON.stringify(data, null, 2));
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Upload Document</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" name="file" required />
        <button type="submit">Upload</button>
      </form>
      {status && (
        <pre style={{ marginTop: "1rem", background: "#f4f4f4", padding: "1rem" }}>
          {status}
        </pre>
      )}
    </div>
  );
}
