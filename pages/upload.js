import { useCallback, useMemo, useState } from "react";

const MAX_FILES = 50;
const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
const UPLOAD_ENDPOINT = "/api/upload";    // hits your API route

const categories  = ['Documents','Images','Videos','Audio','Archives','Spreadsheets','Presentations','Code','Other'];
const priorities  = ['Low','Medium','High','Urgent'];
const hierarchies = ['Level 1','Level 2','Level 3','Level 4','Level 5'];
const sapModules  = ['FI - Finance','CO - Controlling','SD - Sales & Distribution','MM - Materials Management','PP - Production Planning','HR - Human Resources','PM - Plant Maintenance','QM - Quality Management','WM - Warehouse Management','PS - Project Systems','Other'];
const contentTypes= ['Manual','Process Document','Training Material','Policy','Procedure','Form','Template','Report','Specification','Other'];

function ext(name) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}
function getDefaultCategory(filename) {
  const e = ext(filename);
  if (['jpg','jpeg','png','gif','bmp','svg','webp'].includes(e)) return 'Images';
  if (['mp4','avi','mkv','mov','wmv','flv'].includes(e)) return 'Videos';
  if (['mp3','wav','flac','aac','ogg'].includes(e)) return 'Audio';
  if (['zip','rar','7z','tar','gz'].includes(e)) return 'Archives';
  if (['xls','xlsx','csv'].includes(e)) return 'Spreadsheets';
  if (['ppt','pptx'].includes(e)) return 'Presentations';
  if (['js','html','css','py','java','cpp','c'].includes(e)) return 'Code';
  return 'Documents';
}
function formatSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024, sizes = ['Bytes','KB','MB','GB','TB'];
  const i = Math.floor(Math.log(bytes)/Math.log(k));
  return `${(bytes/Math.pow(k,i)).toFixed(2)} ${sizes[i]}`;
}

export default function UploadPage() {
  const [selected, setSelected] = useState([]); // {id, file, ...meta}
  const [busy, setBusy] = useState(false);
  const [msg, setMsg]   = useState("");

  const onFiles = useCallback((files) => {
    let arr = Array.from(files);
    const over = selected.length + arr.length - MAX_FILES;
    if (over > 0) arr = arr.slice(0, arr.length - over);

    const valid = [];
    for (const f of arr) {
      if (f.size > MAX_SIZE_BYTES) {
        console.warn(`Skipping ${f.name}: too large`);
        continue;
      }
      valid.push({
        id: crypto.randomUUID(),
        file: f,
        category: getDefaultCategory(f.name),
        priority: 'Medium',
        hierarchy: 'Level 1',
        sapModule: 'Other',
        contentType: 'Other',
        documentTitle: f.name.replace(/\.[^/.]+$/, ""),
        documentAuthor: ''
      });
    }
    setSelected((cur) => [...cur, ...valid]);
  }, [selected.length]);

  const onInput = (e) => onFiles(e.target.files);

  const removeOne = (id) => setSelected((cur) => cur.filter(x => x.id !== id));
  const updateMeta = (id, field, value) =>
    setSelected((cur) => cur.map(x => x.id === id ? { ...x, [field]: value } : x));

  const onDrop = (e) => {
    e.preventDefault();
    onFiles(e.dataTransfer.files);
  };

  const disabled = useMemo(() => busy || selected.length === 0, [busy, selected.length]);

  const handleSubmit = async () => {
    if (!selected.length) return;
    setBusy(true);
    setMsg("");
    try {
      const form = new FormData();
      for (const f of selected) {
        form.append('files', f.file, f.file.name);
        form.append(`meta_${f.id}`, JSON.stringify({
          category: f.category,
          priority: f.priority,
          hierarchy: f.hierarchy,
          sapModule: f.sapModule,
          contentType: f.contentType,
          documentTitle: f.documentTitle,
          documentAuthor: f.documentAuthor,
        }));
      }
      const res = await fetch(UPLOAD_ENDPOINT, { method: 'POST', body: form });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      setSelected([]);
      setMsg(`🎉 Successfully uploaded files.`);
    } catch (err) {
      console.error(err);
      setMsg('Upload failed. Check console for details.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sme-root container" style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <h1 className="site-title">Upload Documents</h1>

      <div
        id="uploadArea"
        className="upload-area"
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => document.getElementById("fileInput").click()}
        style={{
          border: "2px dashed #ccc",
          padding: 24,
          borderRadius: 8,
          textAlign: "center",
          cursor: "pointer",
          marginBottom: 16
        }}
        aria-label="Upload area"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') document.getElementById("fileInput").click();
        }}
      >
        Drag & drop files here, or click to choose
        <input id="fileInput" type="file" multiple style={{ display: "none" }} onChange={onInput} />
      </div>

      <div id="filesList" className="files-list" aria-live="polite">
        {selected.length === 0 ? null : (
          <>
            <div className="file-count" role="status" style={{ marginBottom: 8 }}>
              {selected.length === 1 ? "1 file ready" : `${selected.length} files ready`}
            </div>

            <div className="files-grid" style={{ display: "grid", gap: 12 }}>
              {selected.map(f => (
                <div key={f.id} className="file-item">
                  <div className="file-header">
                    <div className="file-info">
                      <div className="file-name">{f.file.name}</div>
                      <div className="file-size" style={{ fontSize: 12, color: "#666" }}>{formatSize(f.file.size)}</div>
                    </div>
                    <button className="remove-file" onClick={() => removeOne(f.id)} aria-label={`Remove ${f.file.name}`}>×</button>
                  </div>

                  <div className="file-metadata">
                    <div className="metadata-grid">
                      <div className="metadata-group">
                        <label className="metadata-label">Category</label>
                        <select className="metadata-select" value={f.category} onChange={(e) => updateMeta(f.id, "category", e.target.value)}>
                          {categories.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>

                      <div className="metadata-group">
                        <label className="metadata-label">Priority</label>
                        <select className="metadata-select" value={f.priority} onChange={(e) => updateMeta(f.id, "priority", e.target.value)}>
                          {priorities.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>

                      <div className="metadata-group">
                        <label className="metadata-label">Hierarchy</label>
                        <select className="metadata-select" value={f.hierarchy} onChange={(e) => updateMeta(f.id, "hierarchy", e.target.value)}>
                          {hierarchies.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>

                      <div className="metadata-group">
                        <label className="metadata-label">SAP Module</label>
                        <select className="metadata-select" value={f.sapModule} onChange={(e) => updateMeta(f.id, "sapModule", e.target.value)}>
                          {sapModules.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>

                      <div className="metadata-group">
                        <label className="metadata-label">Content Type</label>
                        <select className="metadata-select" value={f.contentType} onChange={(e) => updateMeta(f.id, "contentType", e.target.value)}>
                          {contentTypes.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>

                      <div className="metadata-group-full">
                        <label className="metadata-label">Document Title</label>
                        <input className="metadata-input" value={f.documentTitle} onChange={(e) => updateMeta(f.id, "documentTitle", e.target.value)} />
                      </div>

                      <div className="metadata-group-full">
                        <label className="metadata-label">Document Author</label>
                        <input className="metadata-input" value={f.documentAuthor} onChange={(e) => updateMeta(f.id, "documentAuthor", e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <button id="submitBtn" className="submit-btn" onClick={handleSubmit} disabled={disabled}>
          {busy ? "Uploading..." : "🚀 Upload Files"}
        </button>
      </div>

      {msg && <div className="upload-msg" style={{ marginTop: 12 }}>{msg}</div>}
    </div>
  );
}

function Select({ label, opts, value, onChange }) {
  return (
    <label className="select-wrap" style={{ display: "grid", gap: 6 }}>
      <span className="select-label" style={{ fontSize: 12, color: "#444" }}>{label}</span>
      <select className="select-input" value={value} onChange={(e) => onChange(e.target.value)} style={{ padding: 8 }}>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
function Input({ label, value, onChange, placeholder }) {
  return (
    <label className="input-wrap" style={{ display: "grid", gap: 6, gridColumn: "1 / -1" }}>
      <span className="input-label" style={{ fontSize: 12, color: "#444" }}>{label}</span>
      <input className="input-field" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ padding: 8 }} />
    </label>
  );
}
