// ==========================================
// SwiftCart Product Catalog (search, filter, sort)
// ==========================================

const ProductCatalog = {
  products: [],
  onRender: null,
  state: {
    category: 'all',
    search: '',
    sort: 'default',
  },
  DEBOUNCE_MS: 300,
  _debounceTimer: null,
  _controlsBound: false,

  init(products, renderCallback) {
    this.products = products;
    this.onRender = renderCallback;
    this.bindControls();
    this.apply(false);
  },

  debounce(fn) {
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(fn, this.DEBOUNCE_MS);
  },

  bindControls() {
    if (this._controlsBound) return;
    this._controlsBound = true;

    const searchInput = document.getElementById('product-search');
    const searchClear = document.getElementById('search-clear');
    const sortSelect = document.getElementById('product-sort');

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.state.search = searchInput.value.trim();
        if (searchClear) {
          searchClear.hidden = !this.state.search;
        }
        this.debounce(() => this.apply(true));
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        this.state.search = '';
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        searchClear.hidden = true;
        this.apply(true);
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        this.state.sort = sortSelect.value;
        this.apply(true);
      });
    }

    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.category = btn.getAttribute('data-filter') || 'all';
        this.apply(true);
      });
    });

    document.querySelectorAll('.category-card').forEach((card) => {
      card.addEventListener('click', () => {
        const category = card.getAttribute('data-category') || 'all';
        this.state.category = category;
        document.querySelectorAll('.filter-btn').forEach((b) => {
          b.classList.toggle(
            'active',
            b.getAttribute('data-filter') === category
          );
        });
        this.apply(true);
        document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  },

  getFilteredProducts() {
    let list = this.products;

    if (this.state.category !== 'all') {
      const cat = this.state.category.toLowerCase();
      list = list.filter((p) => p.category.toLowerCase() === cat);
    }

    if (this.state.search) {
      const q = this.state.search.toLowerCase();
      list = list.filter((p) => {
        const title = (p.title || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const category = (p.category || '').toLowerCase();
        return title.includes(q) || desc.includes(q) || category.includes(q);
      });
    }

    switch (this.state.sort) {
      case 'price-asc':
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }

    return list;
  },

  updateResultsMeta(count) {
    const el = document.getElementById('catalog-results');
    if (!el) return;

    const total = this.products.length;
    const { search, category } = this.state;

    if (count === total && !search && category === 'all') {
      el.textContent = `Showing all ${total} products`;
      return;
    }

    let prefix = `Showing ${count} of ${total} products`;
    if (search) prefix += ` for "${search}"`;
    if (category !== 'all') prefix += ` in ${category}`;
    el.textContent = prefix;
  },

  getEmptyType(filteredCount) {
    if (filteredCount > 0) return null;
    if (this.state.search) return 'search';
    if (this.state.category !== 'all') return 'category';
    return 'default';
  },

  apply(animate = true) {
    const filtered = this.getFilteredProducts();
    this.updateResultsMeta(filtered.length);

    const grid = document.getElementById('product-grid');
    if (grid && animate) {
      grid.classList.add('product-grid--transition');
    }

    if (this.onRender) {
      this.onRender(filtered, this.getEmptyType(filtered.length));
    }

    if (grid && animate) {
      requestAnimationFrame(() => {
        grid.classList.remove('product-grid--transition');
      });
    }
  },

  resetFilters() {
    this.state = { category: 'all', search: '', sort: 'default' };
    const searchInput = document.getElementById('product-search');
    const sortSelect = document.getElementById('product-sort');
    const searchClear = document.getElementById('search-clear');
    if (searchInput) searchInput.value = '';
    if (sortSelect) sortSelect.value = 'default';
    if (searchClear) searchClear.hidden = true;
    document.querySelectorAll('.filter-btn').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-filter') === 'all');
    });
    this.apply(true);
  },
};
