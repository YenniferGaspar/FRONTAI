import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { YenniAI } from '../interfaces/yenniai.model';

@Injectable({
  providedIn: 'root'
})
export class ChatGPTService {
  private apiUrl = 'https://didactic-space-robot-wrrp7w9rv6wjh9jrw-8085.app.github.dev/api/chatgpt';

  constructor(private http: HttpClient) {}

  // POST: enviar pregunta a ChatGPT
  askChatGPT(message: string): Observable<string> {
    return this.http.post(`${this.apiUrl}/ask`, { message }, { responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  // GET: listar conversaciones
  listAll(): Observable<YenniAI[]> {
    return this.http.get<YenniAI[]>(`${this.apiUrl}/list`)
      .pipe(catchError(this.handleError));
  }

  // GET: buscar por id
  findById(id: number): Observable<YenniAI> {
    return this.http.get<YenniAI>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // DELETE: eliminar físicamente
  physicalDelete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // PUT: eliminar lógicamente
  logicalDelete(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/logical-delete`, {})
      .pipe(catchError(this.handleError));
  }

  // PUT: restaurar conversación
  restore(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/restore`, {})
      .pipe(catchError(this.handleError));
  }

  // PUT: actualizar pregunta
  updateQuestion(id: number, newMessage: string): Observable<string> {
    return this.http.put(`${this.apiUrl}/${id}/update-question`, { message: newMessage }, { responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error inesperado';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Código de error: ${error.status}, Mensaje: ${error.message}`;
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}