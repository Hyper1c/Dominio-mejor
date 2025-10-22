import './styles.css';
import { Login } from './components/Login.js';
import { AdminDashboard } from './components/AdminDashboard.js';
import { SellerDashboard } from './components/SellerDashboard.js';

class App {
  constructor() {
    this.currentView = null;
    this.init();
  }

  init() {
    this.checkAuth();
    this.setupEventListeners();
  }

  checkAuth() {
    const user = sessionStorage.getItem('user');

    if (user) {
      const userData = JSON.parse(user);
      this.showDashboard(userData);
    } else {
      this.showLogin();
    }
  }

  showLogin() {
    const login = new Login();
    const app = document.getElementById('app');
    app.innerHTML = login.render();
    login.attachEventListeners();
    this.currentView = login;
  }

  async showDashboard(user) {
    const app = document.getElementById('app');

    if (user.role === 'admin') {
      const dashboard = new AdminDashboard(user);
      app.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100vh;"><div style="font-size: 18px; color: var(--light-blue);">Cargando panel...</div></div>';
      await dashboard.loadData();
      app.innerHTML = dashboard.render();
      dashboard.attachEventListeners();
      this.currentView = dashboard;
    } else {
      const dashboard = new SellerDashboard(user);
      app.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100vh;"><div style="font-size: 18px; color: var(--light-blue);">Cargando panel...</div></div>';
      await dashboard.loadData();
      app.innerHTML = dashboard.render();
      dashboard.attachEventListeners();
      this.currentView = dashboard;
    }
  }

  setupEventListeners() {
    window.addEventListener('login-success', () => {
      this.checkAuth();
    });

    window.addEventListener('logout', () => {
      this.showLogin();
    });
  }
}

new App();
