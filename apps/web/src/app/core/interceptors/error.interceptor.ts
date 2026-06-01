import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastService } from '../services/toast.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private readonly toastService: ToastService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        const message = this.getErrorMessage(error);
        this.toastService.error(message);
        return throwError(() => error);
      })
    );
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    // Check if backend returned a message
    if (error.error?.message) {
      if (typeof error.error.message === 'string') {
        return error.error.message;
      }
      // If message is an array (validation errors)
      if (Array.isArray(error.error.message)) {
        return error.error.message.join(', ');
      }
    }

    // Map HTTP status codes to user-friendly messages
    const statusMessages: Record<number, string> = {
      400: 'Dados inválidos. Verifique os campos e tente novamente.',
      401: 'Sessão expirada. Faça login novamente.',
      403: 'Você não tem permissão para esta ação.',
      404: 'Recurso não encontrado.',
      409: 'Este registro já existe ou há um conflito.',
      422: 'Dados inválidos. Verifique os campos e tente novamente.',
      500: 'Erro interno do servidor. Tente novamente mais tarde.',
      503: 'Serviço indisponível. Tente novamente mais tarde.',
    };

    return statusMessages[error.status] || 'Ocorreu um erro inesperado. Tente novamente.';
  }
}
