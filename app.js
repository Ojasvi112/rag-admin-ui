// ------- Config -------
const API_BASE = "http://localhost:8080";           // FastAPI base
const MAX_FILES = 50;
const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100MB per file
const UPLOAD_ENDPOINT = `${API_BASE}/api/upload`;  // change to your backend route

// ------- State & elements -------
let selectedFiles = []; // { id, file, ...meta }
const fileInput   = document.getElementById("fileInput");
const filesList   = document.getElementById("filesList");
const submitBtn   = document.getElementById("submitBtn");
const uploadArea  = document.querySelector(".upload-area");

// metadata options
const categories  = ['Documents','Images','Videos','Audio','Archives','Spreadsheets','Presentations','Code','Other'];
const priorities  = ['Low','Medium','High','Urgent'];
const hierarchies = ['Level 1','Level 2','Level 3','Level 4','Level 5'];
const sapModules  = ['FI - Finance','CO - Controlling','SD - Sales & Distribution','MM - Materials Management','PP - Production Planning','HR - Human Resources','PM - Plant Maintenance','QM - Quality Management','WM - Warehouse Management','PS - Project Systems','Other'];
const contentTypes= ['Manual','Process Document','Training Material','Policy','Procedure','Form','Template','Report','Specification','Other'];

// ------- Utils -------
const escapeText = (s) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ext = (name) => name.split('.').pop()?.toLowerCase() || "";

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
  const k=1024, sizes=['Bytes','KB','MB','GB','TB'];
  const i=Math.floor(Math.log(bytes)/Math.log(k));
  return `${(bytes/Math.pow(k,i)).toFixed(2)} ${sizes[i]}`;
}

// ------- Event wiring -------
fileInput.addEventListener('change', (e) => addFiles(Array.from(e.target.files)));
uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
uploadArea.addEventListener('dragleave', (e) => { e.preventDefault(); uploadArea.classList.remove('dragover'); });
uploadArea.addEventListener('drop', (e) => { e.preventDefault(); uploadArea.classList.remove('dragover'); addFiles(Array.from(e.dataTransfer.files)); });
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }});
submitBtn.addEventListener('click', handleSubmit);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && selectedFiles.length) removeFile(selectedFiles.at(-1).id); });

// ------- Core -------
function addFiles(files) {
  const overCount = selectedFiles.length + files.length - MAX_FILES;
  if (overCount > 0) files = files.slice(0, files.length - overCount);

  const valid = [];
  for (const f of files) {
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
  selectedFiles.push(...valid);
  render();
}

function removeFile(id) {
  selectedFiles = selectedFiles.filter(f => f.id !== id);
  render();
}

function updateMeta(id, field, value) {
  const f = selectedFiles.find(x => x.id === id);
  if (f) f[field] = value;
}

function render() {
  submitBtn.disabled = selectedFiles.length === 0;

  filesList.replaceChildren(); // clear
  if (!selectedFiles.length) return;

  const frag = document.createDocumentFragment();

  // file count
  const counter = document.createElement('div');
  counter.className = 'file-count';
  counter.setAttribute('role','status');
  counter.textContent = selectedFiles.length === 1 ? '1 file ready' : `${selectedFiles.length} files ready`;
  frag.appendChild(counter);

  for (const f of selectedFiles) {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.setAttribute('role','group');
    item.setAttribute('aria-label', `File: ${f.file.name}`);

    // header
    const header = document.createElement('div');
    header.className = 'file-header';

    const info = document.createElement('div');
    info.className = 'file-info';
    const name = document.createElement('div');
    name.className = 'file-name';
    name.textContent = f.file.name;
    const size = document.createElement('div');
    size.className = 'file-size';
    size.textContent = formatSize(f.file.size);
    info.append(name, size);

    const remove = document.createElement('button');
    remove.className = 'remove-file';
    remove.setAttribute('aria-label', `Remove ${f.file.name}`);
    remove.title = 'Remove file';
    remove.textContent = '×';
    remove.addEventListener('click', () => removeFile(f.id));

    header.append(info, remove);
    item.appendChild(header);

    // metadata grid
    const grid = document.createElement('div');
    grid.className = 'file-metadata';

    function selectGroup(labelText, options, current, field) {
      const wrap = document.createElement('div'); wrap.className = 'metadata-group';
      const label = document.createElement('label'); label.className = 'metadata-label'; label.textContent = labelText;
      const select = document.createElement('select'); select.className = 'metadata-select';
      for (const opt of options) {
        const o = document.createElement('option'); o.value = opt; o.textContent = opt;
        if (opt === current) o.selected = true;
        select.appendChild(o);
      }
      select.addEventListener('change', (e) => updateMeta(f.id, field, e.target.value));
      wrap.append(label, select); return wrap;
    }
    grid.append(
      selectGroup('Category', categories, f.category, 'category'),
      selectGroup('Priority', priorities, f.priority, 'priority'),
      selectGroup('Hierarchy', hierarchies, f.hierarchy, 'hierarchy'),
      selectGroup('SAP Module', sapModules, f.sapModule, 'sapModule'),
      selectGroup('Content Type', contentTypes, f.contentType, 'contentType'),
    );

    function inputGroup(labelText, value, field, placeholder='') {
      const wrap = document.createElement('div'); wrap.className = 'metadata-group-full';
      const label = document.createElement('label'); label.className = 'metadata-label'; label.textContent = labelText;
      const input = document.createElement('input'); input.className = 'metadata-input'; input.type='text';
      input.value = value; input.placeholder = placeholder;
      input.addEventListener('change', (e) => updateMeta(f.id, field, e.target.value));
      wrap.append(label, input); return wrap;
    }
    grid.append(
      inputGroup('Document Title', f.documentTitle, 'documentTitle', 'Enter document title'),
      inputGroup('Document Author', f.documentAuthor, 'documentAuthor', 'Enter author name'),
    );

    // optional image preview
    if (['jpg','jpeg','png','gif','webp','svg'].includes(ext(f.file.name))) {
      const preview = document.createElement('img');
      preview.alt = `${f.file.name} preview`; preview.style.maxHeight = '120px'; preview.style.maxWidth='100%';
      preview.src = URL.createObjectURL(f.file);
      preview.onload = () => URL.revokeObjectURL(preview.src);
      const wrap = document.createElement('div'); wrap.style.gridColumn = '1 / -1'; wrap.append(preview);
      grid.append(wrap);
    }

    item.appendChild(grid);
    frag.appendChild(item);
  }
  filesList.appendChild(frag);
}

async function handleSubmit() {
  if (!selectedFiles.length) return;

  submitBtn.disabled = true;
  submitBtn.classList.add('loading');
  submitBtn.textContent = 'Uploading...';

  try {
    // Example: multipart/form-data to your backend
    const form = new FormData();
    for (const f of selectedFiles) {
      form.append('files', f.file, f.file.name);
      form.append(`meta_${f.id}`, JSON.stringify({
        category: f.category,
        priority: f.priority,
        hierarchy: f.hierarchy,
        sapModule: f.sapModule,
        contentType: f.contentType,
        documentTitle: f.documentTitle,
        documentAuthor: f.documentAuthor
      }));
    }

    const res = await fetch(UPLOAD_ENDPOINT, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    alert(`🎉 Successfully uploaded ${selectedFiles.length} file(s)!`);

    selectedFiles = [];
    fileInput.value = '';
    render();
  } catch (err) {
    console.error(err);
    alert('Upload failed. Check console for details.');
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.textContent = '🚀 Upload Files';
    submitBtn.disabled = selectedFiles.length === 0;
  }
}
