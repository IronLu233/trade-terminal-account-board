import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Template } from '@/types/queue';

// API endpoint base path
const TEMPLATES_API = '/api/v2/template';

// Type for template payload (create/update)
export type TemplatePayload = {
  name: string;
  script: string;
  parameter?: string;
  executionPath?: string;
};

// Helper function to handle API responses
const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }
  return response.json();
};

// Convert dates in template objects from strings to Date objects
const convertTemplateDates = (template: any): Template => ({
  ...template,
  id: String(template.id), // Ensure ID is a string for consistency
  createdAt: new Date(template.createdAt),
  updatedAt: new Date(template.updatedAt),
});

/**
 * Fetch all templates
 */
export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await fetch(TEMPLATES_API);
      const data = await handleApiResponse<any[]>(response);
      return data
        .map(convertTemplateDates)
        .sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
        );
    },
  });
}

/**
 * Fetch a single template by ID
 */
export function useTemplate(id: string) {
  return useQuery({
    queryKey: ['templates', id],
    queryFn: async () => {
      const response = await fetch(`${TEMPLATES_API}/${id}`);
      const data = await handleApiResponse<any>(response);
      return convertTemplateDates(data);
    },
    enabled: !!id, // Only run the query when ID is provided
  });
}

/**
 * Create a new template
 */
export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: TemplatePayload): Promise<Template> => {
      const response = await fetch(TEMPLATES_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });

      const data = await handleApiResponse<any>(response);
      return convertTemplateDates(data);
    },
    onSuccess: () => {
      // Invalidate and refetch the templates list
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

/**
 * Update an existing template
 */
export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...template
    }: { id: string } & TemplatePayload): Promise<Template> => {
      const response = await fetch(`${TEMPLATES_API}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });

      const data = await handleApiResponse<any>(response);
      return convertTemplateDates(data);
    },
    onSuccess: (data, variables) => {
      // Update the specific template and the templates list
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['templates', variables.id] });
    },
  });
}

/**
 * Delete a template
 */
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      const response = await fetch(`${TEMPLATES_API}/${id}`, {
        method: 'DELETE',
      });

      const data = await handleApiResponse<{ success: boolean }>(response);
      return data.success;
    },
    onSuccess: () => {
      // Invalidate and refetch the templates list
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

/**
 * Run a template
 */
export function useRunTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      queueName,
    }: {
      templateId: number;
      queueName: string;
    }) => {
      const response = await fetch(`${TEMPLATES_API}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ queueName, id: templateId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to run template');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}
