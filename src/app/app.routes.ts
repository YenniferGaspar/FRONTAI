import { Routes } from '@angular/router';
import { GeminiComponent } from './components/gemini/gemini.component';
import { ChatgptComponent } from './components/chatgpt/chatgpt.component';

export const routes: Routes = [
  { path: '', redirectTo: '/gemini', pathMatch: 'full' },
  { path: 'gemini', component: GeminiComponent },
  { path: 'chatgpt', component: ChatgptComponent },
  { path: '**', redirectTo: '/gemini' }
];