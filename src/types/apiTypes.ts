export interface Session {
    access_token: string;
    refresh_token: string;
    user: {
        id: string;
        email: string;
        [key: string]: any;
    };
    [key: string]: any;
}

export interface AuthResponse {
    result: {
        session: Session;
    };
    [key: string]: any;
}


export interface BusinessContextPayload {
    business_name?: string;
    industry?: string;
    location?: string;
    business_type?: string;
    [key: string]: any;
}

export interface IRecentChats {
    id: string;
    current_phase: string;
    mode: string;
    asked_q: string;
    title: string;
    status: string;
    answered_count: number
    created_at: string;
    business_name?: string;
    industry?: string;
    location?: string;
    business_type?: string;
    business_context?: BusinessContextPayload | null;
}

export interface APIResponse<T> {
    success: boolean;
    message: string;
    result: T
}

export interface AngelResponse {
    success: boolean;
    message: string;
    result: {
        reply: string;
        progress: {
            phase: 'GKY' | 'BUSINESS_PLAN' | 'PLAN_TO_ROADMAP_TRANSITION' | 'ROADMAP' | 'ROADMAP_GENERATED' | 'ROADMAP_TO_IMPLEMENTATION_TRANSITION' | 'IMPLEMENTATION',
            answered: number
            total: number
            percent: number
            asked_q?: string;  // Current question tag (e.g., "BUSINESS_PLAN.44")
        };
        web_search_status?: {
            is_searching: boolean;
            query?: string;
            completed?: boolean;
        };
        immediate_response?: string;
        transition_phase?: string;
        business_plan_summary?: string;
        show_accept_modify?: boolean;
        question_number?: number;
    };
}

export interface IGeneratedBP {
    success: boolean;
    message: string;
    result: {
        plan: string;
    };
}

export interface ChatResponse {
    success: boolean;
    message: string;
    result: {
        angelReply: string;
        progress?: number;
    };
}

export interface IRefreshTokenResponse {
  result: {
    session: {
      access_token: string;
      refresh_token: string;
    };
  };
}

export interface Agent {
  id: string;
  agent_type: string;
  name: string;
  description: string;
  capabilities: string[];
  expertise_areas: string[];
  expertise: string;
  research_sources: string[];
}

export interface AgentsResponse {
  success: boolean;
  result: {
    agents: Agent[];
    total_agents: number;
  };
  message?: string;
}

export interface AgentGuidanceResponse {
  success: boolean;
  result: {
    guidance: string;
  };
  message?: string;
}

// Budget Tracking Types
export interface BudgetItem {
  id: string;
  name: string;
  category: 'expense' | 'revenue';
  subcategory?: 'startup_cost' | 'operating_expense' | 'payroll' | 'cogs' | 'revenue';
  estimated_amount: number;
  actual_amount?: number;
  estimated_price?: number;    // revenue items: unit price
  estimated_volume?: number;   // revenue items: unit count
  description?: string;
  is_custom?: boolean;
  is_selected?: boolean;
  isSelected?: boolean;        // kept for backwards compat
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Budget {
  id: string;
  session_id: string;
  initial_investment: number;
  total_estimated_expenses: number;
  total_estimated_revenue: number;
  total_actual_expenses?: number;
  total_actual_revenue?: number;
  items: BudgetItem[];
  created_at: string;
  updated_at: string;
}

export interface BudgetSummary {
  total_estimated: number;
  total_actual: number;
  estimated_expenses: number;
  estimated_revenue: number;
  actual_expenses: number;
  actual_revenue: number;
  variance: number;
}

export interface BudgetCategory {
  name: string;
  estimated_total: number;
  actual_total: number;
  items: BudgetItem[];
  color: string;
}

export interface RevenueStream {
  id: string;
  name: string;
  estimatedPrice: number;
  estimatedVolume: number;
  revenueProjection: number;
  isSelected: boolean;
  isCustom: boolean; // To distinguish user-added streams
  category: "revenue";
}

export interface RevenueStreamInitial {
  name: string;
  estimated_price: number;
  estimated_volume: number;
  category: "revenue";
}
