import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { YenniAI } from '../interfaces/yenniai.model';

@Injectable({
  providedIn: 'root'
})
export class ChatGPTService {
  private apiUrl = 'http://localhost:8080/api/chatgpt'; // Ajusta la URL según tu backend

  constructor(private http: HttpClient) {}

  // POST: enviar pregunta a ChatGPT
  askChatGPT(message: string): Observable<string> {
    return this.http.post(`${this.apiUrl}/ask`, message, { responseType: 'text' });
  }

  // GET: listar conversaciones
  listAll(): Observable<YenniAI[]> {
    return this.http.get<YenniAI[]>(`${this.apiUrl}/list`);
  }

  // GET: buscar por id
  findById(id: number): Observable<YenniAI> {
    return this.http.get<YenniAI>(`${this.apiUrl}/${id}`);
  }

  // DELETE: eliminar físicamente
  physicalDelete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // PUT: eliminar lógicamente
  logicalDelete(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/logical-delete`, {});
  }

  // PUT: restaurar conversación
  restore(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/restore`, {});
  }

  // PUT: actualizar pregunta
  updateQuestion(id: number, newMessage: string): Observable<string> {
    return this.http.put(`${this.apiUrl}/${id}/update-question`, newMessage, { responseType: 'text' });
  }
}
