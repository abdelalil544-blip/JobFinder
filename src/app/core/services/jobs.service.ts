import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap, timeout } from 'rxjs/operators';

import {
  AdzunaApiResponse,
  AdzunaJob,
  Job,
  JobSearchParams,
  JobSearchResult
} from '../models/job.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JobsService {
  private readonly baseUrl = environment.adzunaBaseUrl;
  private readonly RESULTS_PER_PAGE = 20;
  private readonly CACHE_TTL = 5 * 60 * 1000;
  private readonly REQUEST_TIMEOUT = 8000;

  private cache = new Map<string, { data: JobSearchResult; timestamp: number }>();

  constructor(private http: HttpClient) {}

  searchJobs(params: JobSearchParams): Observable<JobSearchResult> {
    const country = (params.country || 'gb').toLowerCase();
    const page = params.page || 1;
    const resultsPerPage = params.resultsPerPage || this.RESULTS_PER_PAGE;

    const url = `${this.baseUrl}/${encodeURIComponent(country)}/search/${page}`;

    let httpParams = new HttpParams()
      .set('app_id', environment.adzunaAppId)
      .set('app_key', environment.adzunaAppKey)
      .set('results_per_page', resultsPerPage.toString())
      .set('content-type', 'application/json');

    if (params.keywords && params.keywords.trim()) {
      httpParams = httpParams.set('what', params.keywords.trim());
    }

    if (params.location && params.location.trim()) {
      httpParams = httpParams.set('where', params.location.trim());
    }

    if (params.category) {
      httpParams = httpParams.set('category', params.category);
    }

    if (params.sortBy && params.sortBy !== 'default') {
      httpParams = httpParams.set('sort_by', params.sortBy);
    }

    if (params.contractType) {
      if (params.contractType === 'permanent') {
        httpParams = httpParams.set('permanent', '1');
      } else if (params.contractType === 'contract') {
        httpParams = httpParams.set('contract', '1');
      }
    }

    if (params.contractTime) {
      if (params.contractTime === 'full_time') {
        httpParams = httpParams.set('full_time', '1');
      } else if (params.contractTime === 'part_time') {
        httpParams = httpParams.set('part_time', '1');
      }
    }

    if (params.salaryMin && params.salaryMin > 0) {
      httpParams = httpParams.set('salary_min', params.salaryMin.toString());
    }

    const cacheKey = `${url}?${httpParams.toString()}`;

    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return of(cached.data);
    }

    return this.http.get<AdzunaApiResponse>(url, { params: httpParams }).pipe(
      timeout(this.REQUEST_TIMEOUT),
      map((response) => this.processResponse(response, page, resultsPerPage)),
      tap((result) => {
        this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
      }),
      catchError((error) => this.handleError(error))
    );
  }

  private processResponse(
    response: AdzunaApiResponse,
    page: number,
    resultsPerPage: number
  ): JobSearchResult {
    const jobs = (response.results || []).map((ad) => this.mapAdzunaJobToJob(ad));
    const totalResults = response.count || 0;
    const totalPages = Math.ceil(totalResults / resultsPerPage);

    return {
      jobs,
      totalResults,
      currentPage: page,
      totalPages,
      itemsPerPage: resultsPerPage
    };
  }

  private mapAdzunaJobToJob(ad: AdzunaJob): Job {
    const salaryMin = ad.salary_min ?? null;
    const salaryMax = ad.salary_max ?? null;

    return {
      id: ad.id?.toString() || '',
      title: this.cleanTitle(ad.title || ''),
      company: {
        name: ad.company?.display_name || 'Unknown Company'
      },
      location: ad.location?.display_name || 'Not specified',
      publicationDate: ad.created || '',
      description: ad.description || '',
      shortDescription: this.truncateText(ad.description || '', 160),
      type: this.formatContractType(ad.contract_type),
      level: this.inferLevel(ad.title || ''),
      categories: ad.category?.label ? [ad.category.label] : [],
      landingPageUrl: ad.redirect_url || '',
      tags: ad.category?.tag ? [ad.category.tag] : [],
      salary: this.formatSalary(salaryMin, salaryMax, ad.salary_is_predicted),
      salaryMin,
      salaryMax,
      contractTime: this.formatContractTime(ad.contract_time)
    };
  }

  private cleanTitle(title: string): string {
    return title
      .replace(/<\/?strong>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  private formatSalary(min: number | null, max: number | null, isPredicted?: number): string {
    if (!min && !max) {
      return '';
    }

    const fmt = (n: number) => {
      if (n >= 1000) {
        return `${Math.round(n / 1000)}k`;
      }
      return n.toString();
    };

    let salary = '';
    if (min && max && min !== max) {
      salary = `£${fmt(min)} - £${fmt(max)}`;
    } else if (min) {
      salary = `£${fmt(min)}+`;
    } else if (max) {
      salary = `Up to £${fmt(max)}`;
    }

    if (isPredicted === 1 && salary) {
      salary += ' (est.)';
    }

    return salary;
  }

  private formatContractType(type?: string): string {
    if (!type) {
      return '';
    }
    const types: Record<string, string> = {
      permanent: 'Permanent',
      contract: 'Contract'
    };
    return types[type] || type;
  }

  private formatContractTime(time?: string): string {
    if (!time) {
      return '';
    }
    const times: Record<string, string> = {
      full_time: 'Full Time',
      part_time: 'Part Time'
    };
    return times[time] || time;
  }

  private inferLevel(title: string): string {
    const t = title.toLowerCase();
    if (t.includes('intern')) return 'Internship';
    if (
      t.includes('junior') ||
      t.includes('entry') ||
      t.includes('jr.') ||
      t.includes('jr ') ||
      t.includes('graduate')
    )
      return 'Entry Level';
    if (t.includes('senior') || t.includes('sr.') || t.includes('sr ') || t.includes('lead'))
      return 'Senior Level';
    if (t.includes('staff') || t.includes('principal')) return 'Staff';
    if (t.includes('manager') || t.includes('director') || t.includes('head of') || t.includes('vp'))
      return 'Management';
    return 'Mid Level';
  }

  private truncateText(text: string, maxLength: number): string {
    if (!text) {
      return '';
    }
    const clean = text
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();

    if (clean.length <= maxLength) {
      return clean;
    }
    return clean.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
  }

  private handleError(error: any): Observable<never> {
    let message = 'An unexpected error occurred. Please try again.';

    if (error.name === 'TimeoutError') {
      message = 'La requete est lente. Merci de reessayer dans quelques secondes.';
    } else if (error.status === 401) {
      message = 'Invalid API credentials. Please check your Adzuna app_id and app_key.';
    } else if (error.status === 403) {
      message = 'Access denied. Please verify your Adzuna API key.';
    } else if (error.status === 429) {
      message = 'Rate limit exceeded (250/day). Please try again later.';
    } else if (error.status === 0) {
      message = 'Network error. Please check your internet connection.';
    } else if (error.status === 404) {
      message = 'No results found for this country/search.';
    } else if (error.status >= 500) {
      message = 'Adzuna service is temporarily unavailable. Please try again later.';
    }

    console.error('[JobsService] API error:', error);
    return throwError(() => ({ message, status: error.status }));
  }
}

