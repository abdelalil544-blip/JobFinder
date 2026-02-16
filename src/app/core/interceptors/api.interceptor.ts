import { HttpErrorResponse, HttpInterceptorFn, HttpParams } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
    let apiReq = req;

    // Add Adzuna API keys only to Adzuna requests
    if (req.url.includes(environment.adzunaBaseUrl)) {
        const params = new HttpParams({ fromString: req.params.toString() })
            .set('app_id', environment.adzunaAppId)
            .set('app_key', environment.adzunaAppKey);

        apiReq = req.clone({ params });
    }

    return next(apiReq).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'Une erreur innatendue est survenue.';

            if (error.error instanceof ErrorEvent) {
                // Client-side error
                errorMessage = `Erreur: ${error.error.message}`;
            } else {
                // Server-side error
                switch (error.status) {
                    case 401:
                        errorMessage = 'Clés API invalides. Veuillez vérifier votre configuration.';
                        break;
                    case 403:
                        errorMessage = 'Accès refusé. Vérifiez vos quotas d\'API.';
                        break;
                    case 404:
                        errorMessage = 'Ressource non trouvée.';
                        break;
                    case 429:
                        errorMessage = 'Limite de requêtes atteinte. Réessayez plus tard.';
                        break;
                    case 500:
                        errorMessage = 'Erreur interne du serveur.';
                        break;
                }
            }

            console.error(`[HTTP Error] ${error.status}: ${errorMessage}`);
            return throwError(() => ({
                originalError: error,
                message: errorMessage,
                status: error.status
            }));
        })
    );
};
