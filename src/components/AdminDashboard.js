import { supabase } from '../supabase.js';

export class AdminDashboard {
  constructor(user) {
    this.user = user;
    this.sellers = [];
    this.endUsers = [];
    this.showModal = false;
    this.editingSeller = null;
  }

  async loadData() {
    await this.loadSellers();
    await this.loadEndUsers();
  }

  async loadSellers() {
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('admin_id', this.user.id)
      .order('created_at', { ascending: false });

    if (!error) {
      this.sellers = data || [];
    }
  }

  async loadEndUsers() {
    const { data, error } = await supabase
      .from('end_users')
      .select(`
        *,
        sellers (username)
      `)
      .order('created_at', { ascending: false });

    if (!error) {
      this.endUsers = data || [];
    }
  }

  async createSeller(username, password, credits) {
    const { data, error } = await supabase
      .from('sellers')
      .insert([{
        username,
        password,
        admin_id: this.user.id,
        credits: parseInt(credits)
      }])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async updateSeller(id, credits) {
    const { data, error } = await supabase
      .from('sellers')
      .update({ credits: parseInt(credits) })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async deleteSeller(id) {
    const { error } = await supabase
      .from('sellers')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  handleLogout() {
    sessionStorage.removeItem('user');
    window.dispatchEvent(new CustomEvent('logout'));
  }

  render() {
    return `
      <div class="dashboard">
        <div class="container">
          <div class="dashboard-header">
            <h1 class="dashboard-title">Panel de Administrador</h1>
            <div style="display: flex; align-items: center; gap: 16px;">
              <div class="dashboard-user">
                <div class="user-avatar">${this.user.username.charAt(0).toUpperCase()}</div>
                <div class="user-info">
                  <div class="user-name">${this.user.username}</div>
                  <div class="user-role">Administrador</div>
                </div>
              </div>
              <button class="btn-logout" id="logoutBtn">Cerrar Sesión</button>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Vendedores Activos</div>
              <div class="stat-value">${this.sellers.length}</div>
              <div class="stat-description">Total de vendedores registrados</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Usuarios Totales</div>
              <div class="stat-value">${this.endUsers.length}</div>
              <div class="stat-description">Usuarios creados por vendedores</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Créditos Disponibles</div>
              <div class="stat-value">${this.sellers.reduce((sum, s) => sum + s.credits, 0)}</div>
              <div class="stat-description">Total de créditos en el sistema</div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Gestión de Vendedores</h2>
              <button class="btn-secondary" id="addSellerBtn">+ Crear Vendedor</button>
            </div>

            <div class="table-container">
              ${this.sellers.length > 0 ? `
                <table class="table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Créditos Disponibles</th>
                      <th>Fecha de Creación</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.sellers.map(seller => `
                      <tr>
                        <td><strong>${seller.username}</strong></td>
                        <td>
                          <span class="badge ${seller.credits > 0 ? 'badge-success' : 'badge-error'}">
                            ${seller.credits} créditos
                          </span>
                        </td>
                        <td>${new Date(seller.created_at).toLocaleDateString('es-ES')}</td>
                        <td>
                          <div class="table-actions">
                            <button class="btn-edit" data-seller-id="${seller.id}" data-action="edit">
                              Editar Créditos
                            </button>
                            <button class="btn-danger" data-seller-id="${seller.id}" data-action="delete">
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : `
                <div class="empty-state">
                  <div class="empty-state-icon">📦</div>
                  <div class="empty-state-text">No hay vendedores registrados</div>
                </div>
              `}
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Todos los Usuarios del Sistema</h2>
            </div>

            <div class="table-container">
              ${this.endUsers.length > 0 ? `
                <table class="table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Creado Por</th>
                      <th>Fecha de Creación</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.endUsers.map(user => `
                      <tr>
                        <td><strong>${user.username}</strong></td>
                        <td>${user.sellers?.username || 'N/A'}</td>
                        <td>${new Date(user.created_at).toLocaleDateString('es-ES')}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : `
                <div class="empty-state">
                  <div class="empty-state-icon">👥</div>
                  <div class="empty-state-text">No hay usuarios en el sistema</div>
                </div>
              `}
            </div>
          </div>
        </div>
      </div>

      ${this.showModal ? this.renderModal() : ''}
    `;
  }

  renderModal() {
    return `
      <div class="modal" id="sellerModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">${this.editingSeller ? 'Editar Créditos' : 'Crear Vendedor'}</h2>
            <button class="btn-close" id="closeModal">×</button>
          </div>

          <form id="sellerForm">
            <div id="modalAlert"></div>

            ${!this.editingSeller ? `
              <div class="form-group">
                <label class="form-label">Usuario</label>
                <input
                  type="text"
                  class="form-input"
                  id="sellerUsername"
                  placeholder="Nombre de usuario"
                  required
                >
              </div>

              <div class="form-group">
                <label class="form-label">Contraseña</label>
                <input
                  type="password"
                  class="form-input"
                  id="sellerPassword"
                  placeholder="Contraseña del vendedor"
                  required
                >
              </div>
            ` : ''}

            <div class="form-group">
              <label class="form-label">Créditos</label>
              <input
                type="number"
                class="form-input"
                id="sellerCredits"
                placeholder="Número de créditos"
                min="0"
                value="${this.editingSeller?.credits || ''}"
                required
              >
            </div>

            <div class="form-actions">
              <button type="button" class="btn-cancel" id="cancelBtn">Cancelar</button>
              <button type="submit" class="btn-submit">
                ${this.editingSeller ? 'Actualizar' : 'Crear Vendedor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      this.handleLogout();
    });

    document.getElementById('addSellerBtn')?.addEventListener('click', () => {
      this.editingSeller = null;
      this.showModal = true;
      this.refresh();
    });

    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sellerId = btn.dataset.sellerId;
        this.editingSeller = this.sellers.find(s => s.id === sellerId);
        this.showModal = true;
        this.refresh();
      });
    });

    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('¿Estás seguro de eliminar este vendedor? Esto también eliminará todos sus usuarios.')) {
          try {
            await this.deleteSeller(btn.dataset.sellerId);
            await this.loadData();
            this.refresh();
          } catch (error) {
            alert('Error al eliminar: ' + error.message);
          }
        }
      });
    });

    if (this.showModal) {
      document.getElementById('closeModal')?.addEventListener('click', () => {
        this.showModal = false;
        this.editingSeller = null;
        this.refresh();
      });

      document.getElementById('cancelBtn')?.addEventListener('click', () => {
        this.showModal = false;
        this.editingSeller = null;
        this.refresh();
      });

      document.getElementById('sellerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const modalAlert = document.getElementById('modalAlert');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        try {
          submitBtn.disabled = true;

          if (this.editingSeller) {
            const credits = document.getElementById('sellerCredits').value;
            await this.updateSeller(this.editingSeller.id, credits);
            modalAlert.innerHTML = '<div class="alert alert-success">✓ Créditos actualizados</div>';
          } else {
            const username = document.getElementById('sellerUsername').value;
            const password = document.getElementById('sellerPassword').value;
            const credits = document.getElementById('sellerCredits').value;
            await this.createSeller(username, password, credits);
            modalAlert.innerHTML = '<div class="alert alert-success">✓ Vendedor creado exitosamente</div>';
          }

          setTimeout(async () => {
            this.showModal = false;
            this.editingSeller = null;
            await this.loadData();
            this.refresh();
          }, 1000);

        } catch (error) {
          modalAlert.innerHTML = `<div class="alert alert-error">✕ ${error.message}</div>`;
          submitBtn.disabled = false;
        }
      });

      document.getElementById('sellerModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'sellerModal') {
          this.showModal = false;
          this.editingSeller = null;
          this.refresh();
        }
      });
    }
  }

  refresh() {
    const app = document.getElementById('app');
    app.innerHTML = this.render();
    this.attachEventListeners();
  }
}
