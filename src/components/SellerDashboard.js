import { supabase } from '../supabase.js';

export class SellerDashboard {
  constructor(user) {
    this.user = user;
    this.myUsers = [];
    this.showModal = false;
    this.editingUser = null;
  }

  async loadData() {
    await this.loadMyUsers();
    await this.refreshSellerData();
  }

  async refreshSellerData() {
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('id', this.user.id)
      .single();

    if (!error && data) {
      this.user = { ...this.user, ...data };
      const currentUser = JSON.parse(sessionStorage.getItem('user'));
      sessionStorage.setItem('user', JSON.stringify({ ...currentUser, ...data }));
    }
  }

  async loadMyUsers() {
    const { data, error } = await supabase
      .from('end_users')
      .select('*')
      .eq('seller_id', this.user.id)
      .order('created_at', { ascending: false });

    if (!error) {
      this.myUsers = data || [];
    }
  }

  async createUser(username, password) {
    if (this.user.credits <= 0) {
      throw new Error('No tienes créditos suficientes. Contacta al administrador para comprar más créditos.');
    }

    const { data: userData, error: userError } = await supabase
      .from('end_users')
      .insert([{
        username,
        password,
        seller_id: this.user.id
      }])
      .select()
      .single();

    if (userError) {
      throw new Error(userError.message);
    }

    const { error: creditError } = await supabase
      .from('sellers')
      .update({ credits: this.user.credits - 1 })
      .eq('id', this.user.id);

    if (creditError) {
      await supabase.from('end_users').delete().eq('id', userData.id);
      throw new Error('Error al descontar crédito');
    }

    return userData;
  }

  async updateUser(id, username, password) {
    const updateData = { username };
    if (password && password.trim() !== '') {
      updateData.password = password;
    }

    const { data, error } = await supabase
      .from('end_users')
      .update(updateData)
      .eq('id', id)
      .eq('seller_id', this.user.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async deleteUser(id) {
    const { error } = await supabase
      .from('end_users')
      .delete()
      .eq('id', id)
      .eq('seller_id', this.user.id);

    if (error) {
      throw new Error(error.message);
    }
  }

  handleLogout() {
    sessionStorage.removeItem('user');
    window.dispatchEvent(new CustomEvent('logout'));
  }

  render() {
    const creditsStatus = this.user.credits > 5 ? 'success' : this.user.credits > 0 ? 'warning' : 'error';

    return `
      <div class="dashboard">
        <div class="container">
          <div class="dashboard-header">
            <h1 class="dashboard-title">Panel de Vendedor</h1>
            <div style="display: flex; align-items: center; gap: 16px;">
              <div class="dashboard-user">
                <div class="user-avatar">${this.user.username.charAt(0).toUpperCase()}</div>
                <div class="user-info">
                  <div class="user-name">${this.user.username}</div>
                  <div class="user-role">Vendedor</div>
                </div>
              </div>
              <button class="btn-logout" id="logoutBtn">Cerrar Sesión</button>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Créditos Disponibles</div>
              <div class="stat-value">${this.user.credits}</div>
              <div class="stat-description">
                <span class="badge badge-${creditsStatus}">
                  ${this.user.credits > 0 ? 'Créditos activos' : 'Sin créditos'}
                </span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Usuarios Creados</div>
              <div class="stat-value">${this.myUsers.length}</div>
              <div class="stat-description">Total de usuarios registrados</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Última Actividad</div>
              <div class="stat-value" style="font-size: 24px;">
                ${this.myUsers.length > 0 ? new Date(this.myUsers[0].created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '--'}
              </div>
              <div class="stat-description">Último usuario creado</div>
            </div>
          </div>

          ${this.user.credits <= 0 ? `
            <div class="card" style="background: rgba(255, 59, 48, 0.1); border-color: rgba(255, 59, 48, 0.3);">
              <div style="text-align: center; padding: 20px;">
                <h3 style="color: var(--error); margin-bottom: 12px;">⚠️ Sin Créditos Disponibles</h3>
                <p style="color: var(--off-white); opacity: 0.8;">
                  No tienes créditos para crear nuevos usuarios. Contacta al administrador para comprar más créditos.
                </p>
              </div>
            </div>
          ` : ''}

          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Mis Usuarios</h2>
              <button
                class="btn-secondary"
                id="addUserBtn"
                ${this.user.credits <= 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
              >
                + Crear Usuario
              </button>
            </div>

            <div class="table-container">
              ${this.myUsers.length > 0 ? `
                <table class="table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Fecha de Creación</th>
                      <th>Última Actualización</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.myUsers.map(user => `
                      <tr>
                        <td><strong>${user.username}</strong></td>
                        <td>${new Date(user.created_at).toLocaleDateString('es-ES')}</td>
                        <td>${new Date(user.updated_at).toLocaleDateString('es-ES')}</td>
                        <td>
                          <div class="table-actions">
                            <button class="btn-edit" data-user-id="${user.id}" data-action="edit">
                              Editar
                            </button>
                            <button class="btn-danger" data-user-id="${user.id}" data-action="delete">
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
                  <div class="empty-state-icon">👤</div>
                  <div class="empty-state-text">
                    ${this.user.credits > 0 ? 'No has creado usuarios aún' : 'Sin créditos para crear usuarios'}
                  </div>
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
      <div class="modal" id="userModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">${this.editingUser ? 'Editar Usuario' : 'Crear Usuario'}</h2>
            <button class="btn-close" id="closeModal">×</button>
          </div>

          <form id="userForm">
            <div id="modalAlert"></div>

            <div class="form-group">
              <label class="form-label">Usuario</label>
              <input
                type="text"
                class="form-input"
                id="userName"
                placeholder="Nombre de usuario"
                value="${this.editingUser?.username || ''}"
                required
              >
            </div>

            <div class="form-group">
              <label class="form-label">Contraseña ${this.editingUser ? '(dejar vacío para no cambiar)' : ''}</label>
              <input
                type="password"
                class="form-input"
                id="userPassword"
                placeholder="Contraseña"
                ${!this.editingUser ? 'required' : ''}
              >
            </div>

            ${!this.editingUser ? `
              <div style="padding: 12px; background: rgba(0, 163, 255, 0.1); border-radius: 8px; margin-bottom: 20px;">
                <p style="font-size: 13px; color: var(--accent-blue); margin: 0;">
                  ℹ️ Se descontará 1 crédito al crear este usuario. Créditos disponibles: <strong>${this.user.credits}</strong>
                </p>
              </div>
            ` : ''}

            <div class="form-actions">
              <button type="button" class="btn-cancel" id="cancelBtn">Cancelar</button>
              <button type="submit" class="btn-submit">
                ${this.editingUser ? 'Actualizar' : 'Crear Usuario'}
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

    document.getElementById('addUserBtn')?.addEventListener('click', () => {
      if (this.user.credits <= 0) {
        alert('No tienes créditos disponibles. Contacta al administrador.');
        return;
      }
      this.editingUser = null;
      this.showModal = true;
      this.refresh();
    });

    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.dataset.userId;
        this.editingUser = this.myUsers.find(u => u.id === userId);
        this.showModal = true;
        this.refresh();
      });
    });

    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('¿Estás seguro de eliminar este usuario?')) {
          try {
            await this.deleteUser(btn.dataset.userId);
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
        this.editingUser = null;
        this.refresh();
      });

      document.getElementById('cancelBtn')?.addEventListener('click', () => {
        this.showModal = false;
        this.editingUser = null;
        this.refresh();
      });

      document.getElementById('userForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const modalAlert = document.getElementById('modalAlert');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        try {
          submitBtn.disabled = true;

          const username = document.getElementById('userName').value;
          const password = document.getElementById('userPassword').value;

          if (this.editingUser) {
            await this.updateUser(this.editingUser.id, username, password);
            modalAlert.innerHTML = '<div class="alert alert-success">✓ Usuario actualizado</div>';
          } else {
            await this.createUser(username, password);
            modalAlert.innerHTML = '<div class="alert alert-success">✓ Usuario creado exitosamente</div>';
          }

          setTimeout(async () => {
            this.showModal = false;
            this.editingUser = null;
            await this.loadData();
            this.refresh();
          }, 1000);

        } catch (error) {
          modalAlert.innerHTML = `<div class="alert alert-error">✕ ${error.message}</div>`;
          submitBtn.disabled = false;
        }
      });

      document.getElementById('userModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'userModal') {
          this.showModal = false;
          this.editingUser = null;
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
