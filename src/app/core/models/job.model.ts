export interface JobSearchParams {
  keywords?: string;
  location?: string;
  country?: string;
  page?: number;
  resultsPerPage?: number;
  category?: string;
  sortBy?: string;
  contractType?: 'permanent' | 'contract';
  contractTime?: 'full_time' | 'part_time';
  salaryMin?: number;
}

export interface JobSearchResult {
  jobs: Job[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
}

export interface Job {
  id: string;
  title: string;
  company: {
    name: string;
  };
  location: string;
  publicationDate: string;
  description: string;
  shortDescription: string;
  type: string;
  level: string;
  categories: string[];
  landingPageUrl: string;
  tags: string[];
  salary: string;
  salaryMin: number | null;
  salaryMax: number | null;
  contractTime: string;
}

export interface AdzunaApiResponse {
  count: number;
  results: AdzunaJob[];
  results_per_page?: number;
}

export interface AdzunaJob {
  id: string | number;
  title?: string;
  description?: string;
  created?: string;
  redirect_url?: string;
  company?: {
    display_name?: string;
  };
  location?: {
    display_name?: string;
  };
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted?: number;
  contract_type?: string;
  contract_time?: string;
  category?: {
    label?: string;
    tag?: string;
  };
}
