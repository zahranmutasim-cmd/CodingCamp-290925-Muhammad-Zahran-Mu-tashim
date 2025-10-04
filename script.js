console.log("✅ Script JS berhasil dimuat!");
  
(function () {

	const todoForm = document.getElementById('todoForm');
	const todoInput = document.getElementById('todoInput');
	const dateInput = document.getElementById('dateInput');
	const todoError = document.getElementById('todoError');
	const dateError = document.getElementById('dateError');
	const todoList = document.getElementById('todoList');
	const emptyState = document.getElementById('emptyState');
	const searchInput = document.getElementById('searchInput');
	const filterSelect = document.getElementById('filterSelect');

	const STORAGE_KEY = 'mini_todo_items_v1';

	let items = [];

	function formatDate(iso) {
		if (!iso) return '';
		const d = new Date(iso);
		return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
	}


	function load() {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) items = JSON.parse(raw);
		} catch (e) {
			console.error('Gagal memuat data:', e);
			items = [];
		}
	}


	function save() {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

			try {
				window.dispatchEvent(new Event('todo:storage'));
			} catch (e) {
	
			}
		} catch (e) {
			console.error('Gagal menyimpan data:', e);
		}
	}

	function validate() {
		let ok = true;
		const text = todoInput.value.trim();
		const dateVal = dateInput.value;
		todoError.textContent = '';
		dateError.textContent = '';

		if (!text) {
			todoError.textContent = 'Tugas tidak boleh kosong';
			ok = false;
		} else if (text.length > 200) {
			todoError.textContent = 'Tugas terlalu panjang (maks 200 karakter)';
			ok = false;
		}

		if (!dateVal) {
			dateError.textContent = 'Pilih tanggal';
			ok = false;
		} else {
		
			const dt = new Date(dateVal + 'T00:00:00');
			if (isNaN(dt.getTime())) {
				dateError.textContent = 'Tanggal tidak valid';
				ok = false;
			}
		}

		return ok;
	}

	function render() {
		const query = searchInput.value.trim().toLowerCase();
		const filter = filterSelect.value;

		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(today.getDate() + 1);

		const filtered = items.filter((it) => {
			const textMatch = it.text.toLowerCase().includes(query);
			if (!textMatch) return false;
			const itemDate = new Date(it.dateISO + 'T00:00:00');

			if (filter === 'all') return true;
			if (filter === 'today') {
				return itemDate >= today && itemDate < tomorrow;
			}
			if (filter === 'upcoming') {
				return itemDate >= tomorrow;
			}
			if (filter === 'overdue') {
				return itemDate < today;
			}
			return true;
		});

		todoList.innerHTML = '';

		if (filtered.length === 0) {
			emptyState.style.display = 'block';
			return;
		}
		emptyState.style.display = 'none';

		filtered.sort((a, b) => new Date(a.dateISO) - new Date(b.dateISO));

		for (const it of filtered) {
			const li = document.createElement('li');
			li.className = 'todo-item';
			li.setAttribute('data-id', it.id);

			const main = document.createElement('div');
			main.className = 'todo-main';

			const title = document.createElement('div');
			title.innerHTML = `<strong>${escapeHtml(it.text)}</strong><div class="todo-meta">${formatDate(it.dateISO)}</div>`;

			main.appendChild(title);

			const actions = document.createElement('div');
			actions.className = 'small-actions';

			const datePill = document.createElement('span');
			datePill.className = 'pill';
			datePill.textContent = formatDate(it.dateISO);

			const delBtn = document.createElement('button');
			delBtn.className = 'icon-btn';
			delBtn.setAttribute('aria-label', 'Hapus tugas');
			delBtn.title = 'Hapus';
			delBtn.innerHTML = '🗑️';
			delBtn.addEventListener('click', () => handleDelete(it.id));

			actions.appendChild(datePill);
			actions.appendChild(delBtn);

			li.appendChild(main);
			li.appendChild(actions);

			todoList.appendChild(li);
		}
	}

	function escapeHtml(text) {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}
	function handleAdd(e) {
		e.preventDefault();
		if (!validate()) return;

		const text = todoInput.value.trim();
		const dateISO = dateInput.value; 

		const item = {
			id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
			text,
			dateISO,
			createdAt: new Date().toISOString(),
		};
		items.push(item);
		save();
		render();
		todoForm.reset();
		todoInput.focus();
	}

	function handleDelete(id) {
		if (!confirm('Yakin ingin menghapus tugas ini?')) return;
		items = items.filter((i) => i.id !== id);
		save();
		render();
	}

	function bind() {
		todoForm.addEventListener('submit', handleAdd);
		todoForm.addEventListener('reset', () => {
			todoError.textContent = '';
			dateError.textContent = '';
	
			setTimeout(() => todoInput.focus(), 0);
		});

		searchInput.addEventListener('input', () => render());
		filterSelect.addEventListener('change', () => render());

		searchInput.addEventListener('keydown', (ev) => {
			if (ev.key === 'Enter') ev.preventDefault();
		});

		window.addEventListener('storage', (e) => {
			if (e.key === STORAGE_KEY) {
				load();
				render();
			}
		});
		
		window.addEventListener('todo:storage', () => {
	
			load();
			render();
		});
	}

	function init() {
		load();
		bind();
		render();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
	
	window._miniTodo = {
		get items() {
			return items;
		},
	};
})();

