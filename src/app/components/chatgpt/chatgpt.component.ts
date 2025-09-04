import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, catchError, of, finalize } from 'rxjs';
import { ChatGPTService } from '../../service/chatgpt.service';
import { YenniAI } from '../../interfaces/yenniai.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-chatgpt',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatgpt.component.html',
  styleUrls: ['./chatgpt.component.css']
})
export class ChatgptComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;
  
  conversations: YenniAI[] = [];
  currentMessage: string = '';
  isLoading: boolean = false;
  error: string = '';
  selectedConversation: YenniAI | null = null;
  
  private destroy$ = new Subject<void>();
  private shouldScrollToBottom: boolean = false;

  constructor(private chatGPTService: ChatGPTService) {}

  ngOnInit() {
    this.loadConversations();
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Función para formatear fecha (dd/mm/yyyy)
  formatDate(dateString: string): string {
    try {
      const [datePart, timePart] = dateString.split(' ');
      const [year, month, day] = datePart.split('-').map(Number);
      
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return dateString;
    }
  }

  // Función para formatear hora (hh:mm)
  formatTime(dateString: string): string {
    try {
      const [datePart, timePart] = dateString.split(' ');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);
      
      const date = new Date(year, month - 1, day, hours, minutes);
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formateando hora:', error);
      return dateString;
    }
  }

  loadConversations() {
    this.chatGPTService.listAll()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          this.handleError('Error al cargar las conversaciones', error);
          return of([]);
        })
      )
      .subscribe(conversations => {
        // Ordenar conversaciones por fecha de creación (más antiguas primero)
        this.conversations = conversations
          .filter(conv => conv.status === 'A')
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
        this.shouldScrollToBottom = true;
      });
  }

  sendMessage() {
    if (!this.currentMessage.trim() || this.isLoading) return;

    const messageToSend = this.currentMessage.trim();
    this.currentMessage = '';
    this.isLoading = true;
    this.error = '';

    this.chatGPTService.askChatGPT(messageToSend)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          this.handleError('Error al enviar el mensaje', error);
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(response => {
        if (response) {
          this.loadConversations();
        }
      });
  }

  selectConversation(conversation: YenniAI) {
    this.selectedConversation = conversation;
  }

  async deleteConversation(id: number, event: Event) {
    event.stopPropagation();
    
    const result = await Swal.fire({
      title: '🗑️ ¿Eliminar conversación?',
      html: `
        <div style="text-align: center; margin: 20px 0;">
          <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
          <p style="color: #666; margin-bottom: 15px; line-height: 1.5;">
            Esta acción <strong style="color: #dc3545;">no se puede deshacer</strong>.<br>
            La conversación será eliminada permanentemente.
          </p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
            <small style="color: #856404;">
              💡 <strong>Tip:</strong> Si solo quieres ocultar la conversación temporalmente, 
              considera usar la función de archivo en su lugar.
            </small>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#28a745',
      confirmButtonText: '🗑️ Sí, eliminar',
      cancelButtonText: '🛡️ Conservar',
      reverseButtons: true,
      width: '500px',
      customClass: {
        popup: 'swal-delete-popup',
        confirmButton: 'swal-delete-confirm',
        cancelButton: 'swal-delete-cancel'
      },
      focusCancel: true
    });

    if (result.isConfirmed) {
      // Loading durante la eliminación
      Swal.fire({
        title: '🗑️ Eliminando conversación...',
        html: `
          <div style="text-align: center; margin: 20px 0;">
            <div class="swal-loading-spinner" style="
              width: 40px; 
              height: 40px; 
              margin: 0 auto 15px auto; 
              border: 4px solid #f3f3f3; 
              border-top: 4px solid #dc3545; 
              border-radius: 50%; 
              animation: spin 1s linear infinite;
            "></div>
            <p style="color: #666; margin: 0;">Procesando eliminación...</p>
          </div>
        `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false
      });

      this.chatGPTService.logicalDelete(id)
        .pipe(
          takeUntil(this.destroy$),
          catchError(error => {
            Swal.fire({
              title: '❌ Error al eliminar',
              html: `
                <div style="text-align: center; margin: 20px 0;">
                  <div style="font-size: 48px; margin-bottom: 15px;">😞</div>
                  <p style="color: #666; margin-bottom: 10px;">
                    No se pudo eliminar la conversación. Por favor, intenta nuevamente.
                  </p>
                  <small style="color: #999;">
                    Código de error: CONV_DELETE_FAILED
                  </small>
                </div>
              `,
              icon: 'error',
              confirmButtonText: '🔄 Intentar de nuevo',
              confirmButtonColor: '#dc3545',
              showCancelButton: true,
              cancelButtonText: '❌ Cancelar',
              cancelButtonColor: '#6c757d'
            }).then((retryResult) => {
              if (retryResult.isConfirmed) {
                // Volver a intentar eliminar
                setTimeout(() => this.deleteConversation(id, event), 300);
              }
            });
            
            console.error('Error al eliminar la conversación:', error);
            return of(null);
          })
        )
        .subscribe((response) => {
          if (response !== null) {
            this.loadConversations();
            if (this.selectedConversation?.id === id) {
              this.selectedConversation = null;
            }
            
            // Confirmación de eliminación exitosa
            Swal.fire({
              title: '✅ ¡Eliminado con éxito!',
              html: `
                <div style="text-align: center; margin: 20px 0;">
                  <div style="font-size: 48px; margin-bottom: 15px;">🎯</div>
                  <p style="color: #28a745; font-weight: 500; margin-bottom: 10px;">
                    La conversación ha sido eliminada correctamente
                  </p>
                  <small style="color: #666;">
                    Ya no aparecerá en tu historial de conversaciones
                  </small>
                </div>
              `,
              icon: 'success',
              timer: 2500,
              timerProgressBar: true,
              showConfirmButton: false,
              customClass: {
                popup: 'swal-success-popup'
              }
            });
          }
        });
    }
  }

  async updateQuestion(conversation: YenniAI) {
    const { value: newMessage } = await Swal.fire({
      title: 'Editar mensaje',
      input: 'textarea',
      inputValue: conversation.message,
      inputPlaceholder: 'Escribe tu mensaje aquí...',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#6c757d',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'El mensaje no puede estar vacío';
        }
        if (value.trim() === conversation.message) {
          return 'El mensaje no ha cambiado';
        }
        return null;
      }
    });

    if (newMessage && newMessage.trim() !== conversation.message) {
      // Mostrar loading
      Swal.fire({
        title: 'Actualizando...',
        text: 'Por favor espera',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      this.chatGPTService.updateQuestion(conversation.id, newMessage.trim())
        .pipe(
          takeUntil(this.destroy$),
          catchError(error => {
            Swal.fire({
              title: 'Error',
              text: 'No se pudo actualizar el mensaje',
              icon: 'error',
              confirmButtonText: 'Entendido'
            });
            console.error('Error al actualizar el mensaje:', error);
            return of(null);
          })
        )
        .subscribe(() => {
          this.loadConversations();
          Swal.fire({
            title: '¡Actualizado!',
            text: 'El mensaje ha sido actualizado correctamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        });
    }
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearError() {
    this.error = '';
  }

  focusInput() {
    if (this.messageInput) {
      this.messageInput.nativeElement.focus();
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  private handleError(message: string, error: any) {
    // Mostrar error con SweetAlert
    Swal.fire({
      title: 'Error',
      text: message,
      icon: 'error',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#dc3545'
    });
    
    this.error = message;
    console.error(`${message}:`, error);
  }
}