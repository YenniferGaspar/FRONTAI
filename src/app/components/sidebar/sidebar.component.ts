import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'] // ojo, es style**Urls**
})
export class SidebarComponent {
  // Opciones del menú
  menuItems = [
    { path: '/gemini', icon: '🧠', label: 'Gemini' },
    { path: '/chatgpt', icon: '🤖', label: 'ChatGPT' }
  ];
}
