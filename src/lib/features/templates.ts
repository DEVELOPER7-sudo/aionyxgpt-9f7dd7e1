import { supabase } from '../../integrations/supabase/client';
import { PromptTemplate, TemplateFavorite } from '../../types/features';

// ============================================================
// TEMPLATE OPERATIONS
// ============================================================

export const createTemplate = async (
  workspaceId: string,
  userId: string,
  name: string,
  content: string,
  options?: {
    description?: string;
    category?: string;
    variables?: string[];
    isPublic?: boolean;
  }
): Promise<PromptTemplate> => {
  // Extract variables from content ({{variable}} format)
  const variableRegex = /\{\{(\w+)\}\}/g;
  const extractedVars = Array.from(content.matchAll(variableRegex), (m) => m[1]);
  const variables = options?.variables || extractedVars;

  const { data, error } = await supabase
    .from('prompt_templates')
    .insert({
      workspace_id: workspaceId,
      created_by: userId,
      name,
      content,
      description: options?.description,
      category: options?.category,
      variables,
      is_public: options?.isPublic || false,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create template: ${error.message}`);
  return data;
};

export const getTemplates = async (workspaceId: string): Promise<PromptTemplate[]> => {
  const { data, error } = await supabase
    .from('prompt_templates')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch templates: ${error.message}`);
  return data || [];
};

export const getPublicTemplates = async (limit: number = 50): Promise<PromptTemplate[]> => {
  const { data, error } = await supabase
    .from('prompt_templates')
    .select('*')
    .eq('is_public', true)
    .order('download_count', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch public templates: ${error.message}`);
  return data || [];
};

export const searchTemplates = async (
  workspaceId: string,
  query: string
): Promise<PromptTemplate[]> => {
  const { data, error } = await supabase
    .from('prompt_templates')
    .select('*')
    .eq('workspace_id', workspaceId)
    .or(
      `name.ilike.%${query}%,description.ilike.%${query}%,content.ilike.%${query}%,category.ilike.%${query}%`
    )
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to search templates: ${error.message}`);
  return data || [];
};

export const updateTemplate = async (
  templateId: string,
  updates: Partial<PromptTemplate>
): Promise<PromptTemplate> => {
  const { data, error } = await supabase
    .from('prompt_templates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', templateId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update template: ${error.message}`);
  return data;
};

export const deleteTemplate = async (templateId: string): Promise<void> => {
  const { error } = await supabase.from('prompt_templates').delete().eq('id', templateId);

  if (error) throw new Error(`Failed to delete template: ${error.message}`);
};

// ============================================================
// TEMPLATE RENDERING
// ============================================================

export const renderTemplate = (template: PromptTemplate, variables: Record<string, string>): string => {
  let rendered = template.content;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    rendered = rendered.replace(regex, value);
  }

  return rendered;
};

// ============================================================
// TEMPLATE FAVORITES
// ============================================================

export const favoriteTemplate = async (
  userId: string,
  templateId: string
): Promise<TemplateFavorite> => {
  const { data, error } = await supabase
    .from('template_favorites')
    .insert({
      user_id: userId,
      template_id: templateId,
    })
    .select()
    .single();

  if (error && error.code !== '23505') {
    // Ignore if already favorited
    throw new Error(`Failed to favorite template: ${error.message}`);
  }

  return data;
};

export const unfavoriteTemplate = async (userId: string, templateId: string): Promise<void> => {
  const { error } = await supabase
    .from('template_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('template_id', templateId);

  if (error) throw new Error(`Failed to unfavorite template: ${error.message}`);
};

export const getUserFavoriteTemplates = async (userId: string): Promise<PromptTemplate[]> => {
  const { data, error } = await supabase
    .from('template_favorites')
    .select('prompt_templates(*)')
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to fetch favorite templates: ${error.message}`);
  return (data || []).map((item) => item.prompt_templates);
};

export const isTemplateFavorited = async (userId: string, templateId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('template_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('template_id', templateId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to check favorite: ${error.message}`);
  }

  return !!data;
};

// ============================================================
// TEMPLATE CATEGORIES
// ============================================================

export const getTemplateCategories = async (workspaceId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('prompt_templates')
    .select('category')
    .eq('workspace_id', workspaceId)
    .not('category', 'is', null)
    .distinct();

  if (error) throw new Error(`Failed to fetch categories: ${error.message}`);
  return (data || []).map((item) => item.category).filter(Boolean);
};

export const getTemplatesByCategory = async (
  workspaceId: string,
  category: string
): Promise<PromptTemplate[]> => {
  const { data, error } = await supabase
    .from('prompt_templates')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch templates by category: ${error.message}`);
  return data || [];
};

// ============================================================
// TEMPLATE DOWNLOAD TRACKING
// ============================================================

export const incrementTemplateDownloads = async (templateId: string): Promise<void> => {
  const template = await getTemplate(templateId);

  if (template) {
    await updateTemplate(templateId, {
      download_count: (template.download_count || 0) + 1,
    });
  }
};

export const getTemplate = async (templateId: string): Promise<PromptTemplate | null> => {
  const { data, error } = await supabase
    .from('prompt_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch template: ${error.message}`);
  }

  return data || null;
};

// ============================================================
// BUILT-IN TEMPLATES
// ============================================================

export const BUILT_IN_TEMPLATES = [
  {
    name: 'Email Response',
    category: 'Communication',
    description: 'Professional email response template',
    content: `Subject: RE: {{subject}}

Hi {{name}},

Thank you for your message regarding {{topic}}.

{{content}}

Best regards`,
    variables: ['subject', 'name', 'topic', 'content'],
  },
  {
    name: 'Bug Report',
    category: 'Technical',
    description: 'Structured bug report template',
    content: `## Bug Report

**Environment:** {{environment}}
**Severity:** {{severity}}

### Description
{{description}}

### Steps to Reproduce
1. {{step1}}
2. {{step2}}
3. {{step3}}

### Expected Behavior
{{expected}}

### Actual Behavior
{{actual}}

### Additional Context
{{context}}`,
    variables: ['environment', 'severity', 'description', 'step1', 'step2', 'step3', 'expected', 'actual', 'context'],
  },
  {
    name: 'Meeting Notes',
    category: 'Documentation',
    description: 'Meeting notes template',
    content: `# Meeting Notes - {{date}}

**Attendees:** {{attendees}}
**Duration:** {{duration}}

## Agenda
- {{agenda_item_1}}
- {{agenda_item_2}}
- {{agenda_item_3}}

## Discussion
{{discussion}}

## Action Items
- [ ] {{action_1}} (Owner: {{owner_1}})
- [ ] {{action_2}} (Owner: {{owner_2}})

## Next Meeting
{{next_meeting_date}}`,
    variables: ['date', 'attendees', 'duration', 'agenda_item_1', 'agenda_item_2', 'agenda_item_3', 'discussion', 'action_1', 'owner_1', 'action_2', 'owner_2', 'next_meeting_date'],
  },
  {
    name: 'Research Summary',
    category: 'Research',
    description: 'Research findings summary template',
    content: `# Research Summary: {{topic}}

## Overview
{{overview}}

## Key Findings
1. {{finding_1}}
2. {{finding_2}}
3. {{finding_3}}

## Methodology
{{methodology}}

## Sources
- {{source_1}}
- {{source_2}}
- {{source_3}}

## Conclusions
{{conclusions}}

## Further Research Needed
{{further_research}}`,
    variables: ['topic', 'overview', 'finding_1', 'finding_2', 'finding_3', 'methodology', 'source_1', 'source_2', 'source_3', 'conclusions', 'further_research'],
  },
];

export const loadBuiltInTemplates = async (
  workspaceId: string,
  userId: string
): Promise<void> => {
  for (const template of BUILT_IN_TEMPLATES) {
    const exists = await supabase
      .from('prompt_templates')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('name', template.name)
      .single();

    if (!exists.data) {
      await createTemplate(workspaceId, userId, template.name, template.content, {
        description: template.description,
        category: template.category,
        variables: template.variables,
        isPublic: false,
      });
    }
  }
};
