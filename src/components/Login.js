import { supabase } from '../supabase.js';

export class Login {
  constructor() {
    this.selectedRole = 'admin';
  }

  async handleLogin(username, password, role) {
    try {
      const table = role === 'admin' ? 'admins' : 'sellers';

      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return { success: false, message: 'Usuario o contraseña incorrectos' };
      }

      sessionStorage.setItem('user', JSON.stringify({ ...data, role }));
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  render() {
    return `
      <div class="login-container">
        <div class="login-card">
          <div class="login-header">
            <div class="login-logo">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
            </div>
            <h1 class="login-title">Panel Administrativo</h1>
            <p class="login-subtitle">Ingresa tus credenciales para continuar</p>
          </div>

          <div class="role-selector">
            <button class="role-btn ${this.selectedRole === 'admin' ? 'active' : ''}" data-role="admin">
              Administrador
            </button>
            <button class="role-btn ${this.selectedRole === 'seller' ? 'active' : ''}" data-role="seller">
              Vendedor
            </button>
          </div>

          <form id="loginForm">
            <div class="form-group">
              <label class="form-label">Usuario</label>
              <input
                type="text"
                class="form-input"
                id="username"
                placeholder="Ingresa tu usuario"
                required
                autocomplete="username"
              >
            </div>

            <div class="form-group">
              <label class="form-label">Contraseña</label>
              <input
                type="password"
                class="form-input"
                id="password"
                placeholder="Ingresa tu contraseña"
                required
                autocomplete="current-password"
              >
            </div>

            <div id="alertContainer"></div>

            <button type="submit" class="btn-primary">
              Iniciar Sesión
            </button>
          </form>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    const roleBtns = document.querySelectorAll('.role-btn');
    roleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        roleBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.selectedRole = e.target.dataset.role;
      });
    });

    const form = document.getElementById('loginForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const submitBtn = form.querySelector('button[type="submit"]');
      const alertContainer = document.getElementById('alertContainer');

      submitBtn.disabled = true;
      submitBtn.textContent = 'Iniciando sesión...';

      const result = await this.handleLogin(username, password, this.selectedRole);

      if (result.success) {
        alertContainer.innerHTML = `
          <div class="alert alert-success">
            ✓ Inicio de sesión exitoso
          </div>
        `;
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('login-success'));
        }, 500);
      } else {
        alertContainer.innerHTML = `
          <div class="alert alert-error">
            ✕ ${result.message}
          </div>
        `;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Iniciar Sesión';
      }
    });
  }
}
