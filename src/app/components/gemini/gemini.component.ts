import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../service/gemini.service';
import { YenniAI } from '../../interfaces/yenniai.model';

interface Message {
  id?: number;
  content: string;
  isUser: boolean;
  timestamp: Date;
  status?: string;
}

@Component({
  selector: 'app-gemini',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gemini.component.html',
  styleUrls: ['./gemini.component.css']
})
export class GeminiComponent implements OnInit {
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;

  // Propiedades del componente
  conversations: YenniAI[] = [];
  currentConversation: YenniAI | null = null;
  messages: Message[] = [];
  currentMessage: string = '';
  isLoading: boolean = false;
  selectedConversationId: number | null = null;

  // Sugerencias para la pantalla de bienvenida
  suggestions = [
    { icon: '🧠', text: 'Explícame un concepto', prompt: '¿Podrías explicarme cómo funciona...?' },
    { icon: '💻', text: 'Ayuda con código', prompt: 'Necesito ayuda con este código:' },
    { icon: '✍️', text: 'Escritura creativa', prompt: 'Ayúdame a escribir una historia sobre...' },
    { icon: '🔍', text: 'Análisis de datos', prompt: 'Analiza estos datos y dime qué patrones encuentras' }
  ];

  constructor(private geminiService: GeminiService) {}

  ngOnInit(): void {
    this.loadConversations();
  }

  // Cargar todas las conversaciones
  loadConversations(): void {
    this.geminiService.listAll().subscribe({
      next: (conversations) => {
        this.conversations = conversations.filter(conv => conv.status === 'A');
        console.log('Conversaciones cargadas:', conversations);
      },
      error: (error) => {
        console.error('Error al cargar conversaciones:', error);
      }
    });
  }

  // Seleccionar una conversación del historial
  selectConversation(conversation: YenniAI): void {
    this.selectedConversationId = conversation.id;
    this.currentConversation = conversation;
    
    // Convertir la conversación a mensajes para mostrar en la interfaz
    this.messages = [
      {
        id: conversation.id,
        content: conversation.message,
        isUser: true,
        timestamp: new Date(conversation.createdAt),
        status: conversation.status
      },
      {
        content: conversation.response,
        isUser: false,
        timestamp: new Date(conversation.createdAt)
      }
    ];

    this.scrollToBottom();
  }

  // Enviar nuevo mensaje
  sendMessage(): void {
    if (!this.currentMessage.trim() || this.isLoading) return;

    const userMessage = this.currentMessage.trim();
    this.currentMessage = '';

    // Agregar mensaje del usuario a la interfaz
    this.messages.push({
      content: userMessage,
      isUser: true,
      timestamp: new Date()
    });

    this.isLoading = true;
    this.scrollToBottom();

    try {
      // Llamar al servicio para obtener respuesta de Gemini
      this.geminiService.askGemini(userMessage).subscribe({
        next: (response) => {
          // Agregar respuesta de Gemini a la interfaz
          this.messages.push({
            content: response,
            isUser: false,
            timestamp: new Date()
          });
          
          this.isLoading = false;
          this.scrollToBottom();
          
          // Recargar conversaciones para actualizar el historial
          this.loadConversations();
        },
        error: (error) => {
          console.error('Error al enviar mensaje:', error);
          this.messages.push({
            content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.',
            isUser: false,
            timestamp: new Date()
          });
          this.isLoading = false;
          this.scrollToBottom();
        }
      });
    } catch (error) {
      console.error('Error inesperado:', error);
      this.isLoading = false;
    }
  }

  // Usar una sugerencia predefinida
  useSuggestion(suggestion: any): void {
    this.currentMessage = suggestion.prompt;
    this.focusInput();
  }

  // Iniciar nueva conversación
  startNewConversation(): void {
    this.currentConversation = null;
    this.selectedConversationId = null;
    this.messages = [];
    this.currentMessage = '';
    this.focusInput();
  }

  // Eliminar conversación (eliminación lógica)
  deleteConversation(conversationId: number, event: Event): void {
    event.stopPropagation();
    
    if (confirm('¿Estás seguro de que deseas eliminar esta conversación?')) {
      this.geminiService.logicalDelete(conversationId).subscribe({
        next: () => {
          console.log('Conversación eliminada lógicamente');
          this.loadConversations();
          
          // Si era la conversación actual, iniciar una nueva
          if (this.selectedConversationId === conversationId) {
            this.startNewConversation();
          }
        },
        error: (error) => {
          console.error('Error al eliminar conversación:', error);
        }
      });
    }
  }

  // Eliminar físicamente una conversación (método adicional si lo necesitas)
  physicalDeleteConversation(conversationId: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar permanentemente esta conversación? Esta acción no se puede deshacer.')) {
      this.geminiService.physicalDelete(conversationId).subscribe({
        next: () => {
          console.log('Conversación eliminada físicamente');
          this.loadConversations();
          
          if (this.selectedConversationId === conversationId) {
            this.startNewConversation();
          }
        },
        error: (error) => {
          console.error('Error al eliminar físicamente la conversación:', error);
        }
      });
    }
  }

  // Restaurar conversación eliminada lógicamente
  restoreConversation(conversationId: number): void {
    this.geminiService.restore(conversationId).subscribe({
      next: () => {
        console.log('Conversación restaurada');
        this.loadConversations();
      },
      error: (error) => {
        console.error('Error al restaurar conversación:', error);
      }
    });
  }

  // Actualizar pregunta de una conversación existente
  updateConversationQuestion(conversationId: number, newMessage: string): void {
    this.geminiService.updateQuestion(conversationId, newMessage).subscribe({
      next: (updatedResponse) => {
        console.log('Pregunta actualizada, nueva respuesta:', updatedResponse);
        
        // Actualizar la conversación actual si es la que se editó
        if (this.selectedConversationId === conversationId) {
          // Encontrar y actualizar el mensaje en la interfaz
          const messageIndex = this.messages.findIndex(msg => msg.id === conversationId && msg.isUser);
          if (messageIndex !== -1) {
            this.messages[messageIndex].content = newMessage;
            // Actualizar también la respuesta
            const responseIndex = messageIndex + 1;
            if (responseIndex < this.messages.length && !this.messages[responseIndex].isUser) {
              this.messages[responseIndex].content = updatedResponse;
            }
          }
        }
        
        this.loadConversations();
      },
      error: (error) => {
        console.error('Error al actualizar pregunta:', error);
      }
    });
  }

  // Buscar conversación por ID
  findConversationById(id: number): void {
    this.geminiService.findById(id).subscribe({
      next: (conversation) => {
        console.log('Conversación encontrada:', conversation);
        this.selectConversation(conversation);
      },
      error: (error) => {
        console.error('Error al buscar conversación:', error);
      }
    });
  }

  // Manejar el envío con Enter
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // Copiar mensaje al portapapeles
  copyMessage(content: string): void {
    navigator.clipboard.writeText(content).then(() => {
      console.log('Mensaje copiado al portapapeles');
      // Podrías agregar una notificación visual aquí
    }).catch(err => {
      console.error('Error al copiar mensaje:', err);
    });
  }

  // Regenerar respuesta (actualizar la pregunta con el mismo contenido)
  regenerateResponse(message: Message): void {
    if (message.id && message.isUser) {
      this.updateConversationQuestion(message.id, message.content);
    }
  }

  // Utilidades
  private focusInput(): void {
    setTimeout(() => {
      if (this.messageInput) {
        this.messageInput.nativeElement.focus();
      }
    }, 100);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        const container = this.messagesContainer.nativeElement;
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }

  // Formatear fecha para mostrar en la interfaz
  formatTime(date: Date): string {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  // Formatear fecha para el historial de conversaciones
  formatConversationTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInHours < 24) return `Hace ${diffInHours} h`;
    if (diffInDays === 1) return 'Ayer';
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    
    return date.toLocaleDateString('es-ES');
  }

  // Obtener preview del mensaje para el historial
  getMessagePreview(message: string): string {
    return message.length > 50 ? message.substring(0, 50) + '...' : message;
  }
}