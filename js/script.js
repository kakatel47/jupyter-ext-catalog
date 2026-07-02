// Каталог расширений (имитация БД)
const EXTENSIONS = [
  {
    id: 1, name: "default_cell", category: "Автоматизация",
    description: "Добавляет ячейку с импортами в начало каждого нового блокнота.",
    yaml: `Type: IPython NBExtension
Name: default_cell
Description: Insert default cell on new notebook
Main: main.js
Compatibility: 3.x, 4.x, 5.x, 6.x`,
    jsTemplate: `define(['base/js/namespace'], function(Jupyter) {
  function load_ipython_extension() {
    if (Jupyter.notebook.get_cells().length === 1) {
      var cell = Jupyter.notebook.insert_cell_above('code', 0);
      cell.set_text(\`{{TEXT}}\`);
      Jupyter.notebook.select_prev();
      Jupyter.notebook.execute_cell_and_select_below();
    }
  }
  return { load_ipython_extension: load_ipython_extension };
});`
  },
  {
    id: 2, name: "toc2", category: "Навигация",
    description: "Автоматическое оглавление на основе заголовков Markdown.",
    yaml: `Type: IPython NBExtension
Name: toc2
Description: Table of Contents
Main: main.js
Compatibility: 5.x, 6.x`,
    jsTemplate: `define(['base/js/namespace'], function(Jupyter) {
  function buildTOC() {
    var headers = document.querySelectorAll('.rendered_html h1, .rendered_html h2');
    var toc = '<nav><h2>Contents</h2><ul>';
    headers.forEach(h => toc += '<li>' + h.textContent + '</li>');
    toc += '</ul></nav>';
    document.body.insertAdjacentHTML('afterbegin', toc);
  }
  function load() { Jupyter.events.on('notebook_loaded.Notebook', buildTOC); }
  return { load_ipython_extension: load };
});`
  },
  {
    id: 3, name: "code_prettify", category: "Форматирование",
    description: "Автоформатирование кода по Ctrl+Shift+F (через black/yapf).",
    yaml: `Type: IPython NBExtension
Name: code_prettify
Description: Auto-format code cells
Main: main.js
Compatibility: 4.x, 5.x, 6.x`,
    jsTemplate: `define(['base/js/namespace'], function(Jupyter) {
  function prettify() {
    var cell = Jupyter.notebook.get_selected_cell();
    if (cell.cell_type === 'code') {
      var code = cell.get_text().replace(/\\s+$/gm, '');
      cell.set_text(code);
    }
  }
  function load() {
    Jupyter.keyboard_manager.command_shortcuts.add_shortcut('shift-f', prettify);
  }
  return { load_ipython_extension: load };
});`
  },
  {
    id: 4, name: "hide_input", category: "Визуализация",
    description: "Скрывает ввод в ячейках — полезно для презентаций.",
    yaml: `Type: IPython NBExtension
Name: hide_input
Description: Toggle input visibility
Main: main.js
Compatibility: 5.x, 6.x`,
    jsTemplate: `define(['base/js/namespace'], function(Jupyter) {
  function toggle() {
    document.querySelectorAll('.input').forEach(el => {
      el.style.display = el.style.display === 'none' ? '' : 'none';
    });
  }
  function load() {
    Jupyter.keyboard_manager.command_shortcuts.add_shortcut('shift-i', toggle);
  }
  return { load_ipython_extension: load };
});`
  }
];

let currentExt = null;
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

// Рендер каталога
function render(list) {
  const grid = document.getElementById('catalog');
  grid.innerHTML = list.map(e => `
    <div class="card" data-id="${e.id}">
      <h3>${e.name}</h3>
      <p>${e.description}</p>
      <span class="tag">${e.category}</span>
    </div>
  `).join('');
  grid.querySelectorAll('.card').forEach(card => {
    card.onclick = () => openModal(+card.dataset.id);
  });
}

// Модалка
function openModal(id) {
  currentExt = EXTENSIONS.find(e => e.id === id);
  document.getElementById('modal-title').textContent = currentExt.name;
  document.getElementById('modal-desc').textContent = currentExt.description;
  document.getElementById('modal-input').value = 'import numpy as np\nimport pandas as pd';
  document.getElementById('modal').classList.remove('hidden');
}

document.getElementById('close-btn').onclick = () => {
  document.getElementById('modal').classList.add('hidden');
};

// Генерация ZIP через JSZip
document.getElementById('download-btn').onclick = async () => {
  const text = document.getElementById('modal-input').value;
  const js = currentExt.jsTemplate.replace('{{TEXT}}', text);
  const zip = new JSZip();
  zip.folder(currentExt.name).file('description.yaml', currentExt.yaml);
  zip.folder(currentExt.name).file('main.js', js);
  zip.folder(currentExt.name).file('README.md', `# ${currentExt.name}\n\n${currentExt.description}`);
  const blob = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${currentExt.name}.zip`;
  a.click();
};

// Избранное
document.getElementById('fav-btn').onclick = () => {
  if (!favorites.includes(currentExt.id)) {
    favorites.push(currentExt.id);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavCount();
    alert('⭐ Добавлено в избранное!');
  } else {
    alert('Уже в избранном');
  }
};

function updateFavCount() {
  document.getElementById('fav-count').textContent = favorites.length;
}

document.getElementById('show-favorites').onclick = () => {
  render(EXTENSIONS.filter(e => favorites.includes(e.id)));
};
document.getElementById('show-all').onclick = () => render(EXTENSIONS);

// Старт
render(EXTENSIONS);
updateFavCount();
