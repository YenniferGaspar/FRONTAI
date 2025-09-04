export interface YenniAI {
  id: number;              // ID del registro
  message: string;         // Mensaje enviado
  response: string;        // Respuesta generada
  status: string;          // Estado (por defecto 'A')
  createdAt: string;       // Fecha y hora en formato 'yyyy-MM-dd HH:mm:ss'
}
