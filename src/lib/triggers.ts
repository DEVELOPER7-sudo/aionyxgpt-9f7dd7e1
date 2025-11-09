// Trigger Framework - Storage and Utilities

export interface Trigger {
  trigger: string;
  category: 'Reasoning & Analysis' | 'Research & Information' | 'Planning & Organization' | 'Communication & Style';
  system_instruction: string;
  example: string;
  enabled: boolean;
  custom?: boolean;
}

const STORAGE_KEY = 'onyxgpt_triggers';

// Built-in triggers organized by category
const BUILT_IN_TRIGGERS: Trigger[] = [
  /* ---------------------------- Reasoning & Analysis ---------------------------- */
  {
    "trigger": "reason",
    "category": "Reasoning & Analysis",
    "system_instruction": "Use tags to separate response and after give the final response <reason></reason>final_response. Use logical, step-by-step reasoning to reach conclusions clearly and coherently.",
    "example": "Use \"reason\" to analyze complex problems systematically.",
    "enabled": true
  },
  {
    "trigger": "analyze",
    "category": "Reasoning & Analysis",
    "system_instruction": "Use tags to separate response and after give the final response <analyze></analyze>final_response. Break down the topic into parts, identify relationships, and explain underlying logic.",
    "example": "Use \"analyze\" to examine data or concepts in depth.",
    "enabled": true
  },
  {
    "trigger": "critique",
    "category": "Reasoning & Analysis",
    "system_instruction": "Use tags to separate response and after give the final response <critique></critique>final_response. Evaluate the strengths, weaknesses, and biases of the subject objectively.",
    "example": "Use \"critique\" to assess arguments or work critically.",
    "enabled": true
  },
  {
    "trigger": "debate",
    "category": "Reasoning & Analysis",
    "system_instruction": "Use tags to separate response and after give the final response <debate></debate>final_response. Present arguments for and against the issue before summarizing.",
    "example": "Use \"debate\" to explore multiple perspectives.",
    "enabled": true
  },
  {
    "trigger": "compare",
    "category": "Reasoning & Analysis",
    "system_instruction": "Use tags to separate response and after give the final response <compare></compare>final_response. Identify similarities and differences between the items or ideas.",
    "example": "Use \"compare\" to evaluate similar concepts.",
    "enabled": true
  },
  {
    "trigger": "contrast",
    "category": "Reasoning & Analysis",
    "system_instruction": "Use tags to separate response and after give the final response <contrast></contrast>final_response. Highlight distinctions and divergent features between the listed topics.",
    "example": "Use \"contrast\" to emphasize differences.",
    "enabled": true
  },
  {
    "trigger": "deduce",
    "category": "Reasoning & Analysis",
    "system_instruction": "Use tags to separate response and after give the final response <deduce></deduce>final_response. Apply inference and logic to derive valid conclusions.",
    "example": "Use \"deduce\" for logical problem-solving.",
    "enabled": true
  },
  {
    "trigger": "evaluate",
    "category": "Reasoning & Analysis",
    "system_instruction": "Use tags to separate response and after give the final response <evaluate></evaluate>final_response. Judge the quality, relevance, and strength of evidence.",
    "example": "Use \"evaluate\" to assess merit or value.",
    "enabled": true
  },
  {
    "trigger": "justify",
    "category": "Reasoning & Analysis",
    "system_instruction": "Use tags to separate response and after give the final response <justify></justify>final_response. Defend the claim with rational arguments and factual support.",
    "example": "Use \"justify\" to provide supporting reasoning.",
    "enabled": true
  },
  {
    "trigger": "hypothesize",
    "category": "Reasoning & Analysis",
    "system_instruction": "Use tags to separate response and after give the final response <hypothesize></hypothesize>final_response. Formulate plausible explanations or predictions based on evidence.",
    "example": "Use \"hypothesize\" for theory building.",
    "enabled": true
  },
  {
    "trigger": "examine",
    "category": "Reasoning & Analysis",
    "system_instruction": "Use tags to separate response and after give the final response <examine></examine>final_response. Inspect details thoroughly and comment on implications.",
    "example": "Use \"examine\" for detailed inspection.",
    "enabled": true
  },
  {
    "trigger": "interpret",
    "category": "Reasoning & Analysis",
    "system_instruction": "Use tags to separate response and after give the final response <interpret></interpret>final_response. Explain meaning or significance in clear, contextualized terms.",
    "example": "Use \"interpret\" to decode complex information.",
    "enabled": true
  },
  {
    "trigger": "verify",
    "category": "Reasoning & Analysis",
    "system_instruction": "Use tags to separate response and after give the final response <verify></verify>final_response. Check the accuracy and consistency of statements or data.",
    "example": "Use \"verify\" to confirm facts.",
    "enabled": true
  },
  {
    "trigger": "reflect",
    "category": "Reasoning & Analysis",
    "system_instruction": "Use tags to separate response and after give the final response <reflect></reflect>final_response. Offer thoughtful insights and implications drawn from the topic.",
    "example": "Use \"reflect\" for deeper understanding.",
    "enabled": true
  },
  {
    "trigger": "infer",
    "category": "Reasoning & Analysis",
    "system_instruction": "Use tags to separate response and after give the final response <infer></infer>final_response. Draw reasonable conclusions based on provided information.",
    "example": "Use \"infer\" to read between the lines.",
    "enabled": true
  },
  {
    "trigger": "explore",
    "category": "Reasoning & Analysis",
    "system_instruction": "Use tags to separate response and after give the final response <explore></explore>final_response. Investigate multiple angles or perspectives on the topic.",
    "example": "Use \"explore\" for comprehensive investigation.",
    "enabled": true
  },
  {
    "trigger": "discuss",
    "category": "Reasoning & Analysis",
    "system_instruction": "Use tags to separate response and after give the final response <discuss></discuss>final_response. Provide balanced discussion covering several viewpoints.",
    "example": "Use \"discuss\" for balanced examination.",
    "enabled": true
  },
  {
    "trigger": "validate",
    "category": "Reasoning & Analysis",
    "system_instruction": "Use tags to separate response and after give the final response <validate></validate>final_response. Confirm truth or reliability of claims using known facts.",
    "example": "Use \"validate\" to check credibility.",
    "enabled": true
  },
  {
    "trigger": "assess",
    "category": "Reasoning & Analysis",
    "system_instruction": "Use tags to separate response and after give the final response <assess></assess>final_response. Determine overall soundness or performance relative to standards.",
    "example": "Use \"assess\" for comprehensive evaluation.",
    "enabled": true
  },
  {
    "trigger": "troubleshoot",
    "category": "Reasoning & Analysis",
    "system_instruction": "Use tags to separate response and after give the final response <troubleshoot></troubleshoot>final_response. Identify problems, diagnose causes, and propose corrective steps.",
    "example": "Use \"troubleshoot\" to solve issues.",
    "enabled": true
  },

  /* ---------------------------- Research & Information ---------------------------- */
  {
    "trigger": "search",
    "category": "Research & Information",
    "system_instruction": "Use tags to separate response and after give the final response <search></search>final_response. Perform a brief lookup and present concise factual information.",
    "example": "Use \"search\" for quick factual lookups.",
    "enabled": true
  },
  {
    "trigger": "deep research",
    "category": "Research & Information",
    "system_instruction": "Use tags to separate response and after give the final response <deep_research></deep_research>final_response. Conduct an in-depth, multi-source investigation and summarize findings.",
    "example": "Use \"deep research\" for comprehensive investigations.",
    "enabled": true
  },
  {
    "trigger": "fact-check",
    "category": "Research & Information",
    "system_instruction": "Use tags to separate response and after give the final response <fact_check></fact_check>final_response. Verify factual accuracy and highlight uncertain or false parts.",
    "example": "Use \"fact-check\" to verify claims.",
    "enabled": true
  },
  {
    "trigger": "contextualize",
    "category": "Research & Information",
    "system_instruction": "Use tags to separate response and after give the final response <contextualize></contextualize>final_response. Explain how the topic fits within its historical, cultural, or scientific background.",
    "example": "Use \"contextualize\" to provide background.",
    "enabled": true
  },
  {
    "trigger": "summarize",
    "category": "Research & Information",
    "system_instruction": "Use tags to separate response and after give the final response <summarize></summarize>final_response. Condense material into essential meaning and main points.",
    "example": "Use \"summarize\" to get key points.",
    "enabled": true
  },
  {
    "trigger": "outline",
    "category": "Research & Information",
    "system_instruction": "Use tags to separate response and after give the final response <outline></outline>final_response. Produce a structured outline or bullet framework.",
    "example": "Use \"outline\" to create structure.",
    "enabled": true
  },
  {
    "trigger": "extract",
    "category": "Research & Information",
    "system_instruction": "Use tags to separate response and after give the final response <extract></extract>final_response. Pull out the most relevant facts, names, or data points.",
    "example": "Use \"extract\" to identify key information.",
    "enabled": true
  },
  {
    "trigger": "highlight",
    "category": "Research & Information",
    "system_instruction": "Use tags to separate response and after give the final response <highlight></highlight>final_response. Emphasize key ideas or noteworthy information.",
    "example": "Use \"highlight\" to focus on important parts.",
    "enabled": true
  },
  {
    "trigger": "define",
    "category": "Research & Information",
    "system_instruction": "Use tags to separate response and after give the final response <define></define>final_response. Provide precise definitions and short explanations of terms.",
    "example": "Use \"define\" to explain terms.",
    "enabled": true
  },
  {
    "trigger": "explain",
    "category": "Research & Information",
    "system_instruction": "Use tags to separate response and after give the final response <explain></explain>final_response. Clarify concepts with simple language and examples.",
    "example": "Use \"explain\" for clear understanding.",
    "enabled": true
  },
  {
    "trigger": "describe",
    "category": "Research & Information",
    "system_instruction": "Use tags to separate response and after give the final response <describe></describe>final_response. Portray the subject with factual detail.",
    "example": "Use \"describe\" for detailed portrayal.",
    "enabled": true
  },
  {
    "trigger": "cite",
    "category": "Research & Information",
    "system_instruction": "Use tags to separate response and after give the final response <cite></cite>final_response. Include reference-style mentions of credible sources when applicable.",
    "example": "Use \"cite\" to reference sources.",
    "enabled": true
  },
  {
    "trigger": "reference",
    "category": "Research & Information",
    "system_instruction": "Use tags to separate response and after give the final response <reference></reference>final_response. Acknowledge where facts or ideas originate.",
    "example": "Use \"reference\" to credit sources.",
    "enabled": true
  },
  {
    "trigger": "clarify",
    "category": "Research & Information",
    "system_instruction": "Use tags to separate response and after give the final response <clarify></clarify>final_response. Remove ambiguity and restate ideas for better understanding.",
    "example": "Use \"clarify\" to remove confusion.",
    "enabled": true
  },
  {
    "trigger": "expand",
    "category": "Research & Information",
    "system_instruction": "Use tags to separate response and after give the final response <expand></expand>final_response. Develop the concept further with supporting detail.",
    "example": "Use \"expand\" for more depth.",
    "enabled": true
  },
  {
    "trigger": "compress",
    "category": "Research & Information",
    "system_instruction": "Use tags to separate response and after give the final response <compress></compress>final_response. Shorten content while preserving meaning.",
    "example": "Use \"compress\" to make content concise.",
    "enabled": true
  },

  /* ---------------------------- Planning & Organization ---------------------------- */
  {
    "trigger": "plan",
    "category": "Planning & Organization",
    "system_instruction": "Use tags to separate response and after give the final response <plan></plan>final_response. Generate a logical step-by-step process to achieve the goal.",
    "example": "Use \"plan\" to create action plans.",
    "enabled": true
  },
  {
    "trigger": "roadmap",
    "category": "Planning & Organization",
    "system_instruction": "Use tags to separate response and after give the final response <roadmap></roadmap>final_response. Lay out key milestones and paths toward completion.",
    "example": "Use \"roadmap\" for project planning.",
    "enabled": true
  },
  {
    "trigger": "checklist",
    "category": "Planning & Organization",
    "system_instruction": "Use tags to separate response and after give the final response <checklist></checklist>final_response. Present a task list to complete the objective.",
    "example": "Use \"checklist\" for task lists.",
    "enabled": true
  },
  {
    "trigger": "organize",
    "category": "Planning & Organization",
    "system_instruction": "Use tags to separate response and after give the final response <organize></organize>final_response. Arrange ideas or data into clear categories.",
    "example": "Use \"organize\" to structure information.",
    "enabled": true
  },
  {
    "trigger": "prioritize",
    "category": "Planning & Organization",
    "system_instruction": "Use tags to separate response and after give the final response <prioritize></prioritize>final_response. Order tasks or ideas by importance or urgency.",
    "example": "Use \"prioritize\" to rank importance.",
    "enabled": true
  },
  {
    "trigger": "schedule",
    "category": "Planning & Organization",
    "system_instruction": "Use tags to separate response and after give the final response <schedule></schedule>final_response. Suggest a timeline or time-based arrangement.",
    "example": "Use \"schedule\" for timeline planning.",
    "enabled": true
  },
  {
    "trigger": "brainstorm",
    "category": "Planning & Organization",
    "system_instruction": "Use tags to separate response and after give the final response <brainstorm></brainstorm>final_response. Generate creative ideas without evaluation.",
    "example": "Use \"brainstorm\" for idea generation.",
    "enabled": true
  },
  {
    "trigger": "propose",
    "category": "Planning & Organization",
    "system_instruction": "Use tags to separate response and after give the final response <propose></propose>final_response. Offer a structured and reasoned proposal.",
    "example": "Use \"propose\" to suggest solutions.",
    "enabled": true
  },
  {
    "trigger": "structure",
    "category": "Planning & Organization",
    "system_instruction": "Use tags to separate response and after give the final response <structure></structure>final_response. Present information using logical sections.",
    "example": "Use \"structure\" to organize content.",
    "enabled": true
  },
  {
    "trigger": "map",
    "category": "Planning & Organization",
    "system_instruction": "Use tags to separate response and after give the final response <map></map>final_response. Show conceptual or relational connections.",
    "example": "Use \"map\" to show relationships.",
    "enabled": true
  },
  {
    "trigger": "draft",
    "category": "Planning & Organization",
    "system_instruction": "Use tags to separate response and after give the final response <draft></draft>final_response. Create an initial version with key sections.",
    "example": "Use \"draft\" to build first versions.",
    "enabled": true
  },
  {
    "trigger": "improve",
    "category": "Planning & Organization",
    "system_instruction": "Use tags to separate response and after give the final response <improve></improve>final_response. Suggest refinements to strengthen quality.",
    "example": "Use \"improve\" to enhance writing.",
    "enabled": true
  },
  {
    "trigger": "review",
    "category": "Planning & Organization",
    "system_instruction": "Use tags to separate response and after give the final response <review></review>final_response. Evaluate content and summarize potential revisions.",
    "example": "Use \"review\" for evaluation.",
    "enabled": true
  },

  /* ---------------------------- Communication & Style ---------------------------- */
  {
    "trigger": "simplify",
    "category": "Communication & Style",
    "system_instruction": "Use tags to separate response and after give the final response <simplify></simplify>final_response. Rephrase complex ideas into plain language.",
    "example": "Use \"simplify\" to make content easier.",
    "enabled": true
  },
  {
    "trigger": "formalize",
    "category": "Communication & Style",
    "system_instruction": "Use tags to separate response and after give the final response <formalize></formalize>final_response. Convert tone into a professional register.",
    "example": "Use \"formalize\" for academic tone.",
    "enabled": true
  },
  {
    "trigger": "rephrase",
    "category": "Communication & Style",
    "system_instruction": "Use tags to separate response and after give the final response <rephrase></rephrase>final_response. Rewrite content using different wording with identical meaning.",
    "example": "Use \"rephrase\" to change wording.",
    "enabled": true},
  {
    "trigger": "rewrite",
    "category": "Communication & Style",
    "system_instruction": "Use tags to separate response and after give the final response <rewrite></rewrite>final_response. Produce a clearer version while keeping intent.",
    "example": "Use \"rewrite\" for clarity.",
    "enabled": true
  },
  {
    "trigger": "summarize-for-kids",
    "category": "Communication & Style",
    "system_instruction": "Use tags to separate response and after give the final response <summarize_for_kids></summarize_for_kids>final_response. Explain the idea in age-appropriate, simple terms.",
    "example": "Use \"summarize-for-kids\" for child-friendly explanations.",
    "enabled": true
  },
  {
    "trigger": "persuasive",
    "category": "Communication & Style",
    "system_instruction": "Use tags to separate response and after give the final response <persuasive></persuasive>final_response. Use logical appeals and evidence to persuade.",
    "example": "Use \"persuasive\" for convincing arguments.",
    "enabled": true
  },
  {
    "trigger": "informative",
    "category": "Communication & Style",
    "system_instruction": "Use tags to separate response and after give the final response <informative></informative>final_response. Deliver factual, balanced, educational information.",
    "example": "Use \"informative\" for educational content.",
    "enabled": true
  },
  {
    "trigger": "neutral",
    "category": "Communication & Style",
    "system_instruction": "Use tags to separate response and after give the final response <neutral></neutral>final_response. Maintain objectivity and avoid bias.",
    "example": "Use \"neutral\" for unbiased responses.",
    "enabled": true
  },
  {
    "trigger": "balanced",
    "category": "Communication & Style",
    "system_instruction": "Use tags to separate response and after give the final response <balanced></balanced>final_response. Represent multiple perspectives fairly.",
    "example": "Use \"balanced\" for fair representation.",
    "enabled": true
  },
  {
    "trigger": "empathetic",
    "category": "Communication & Style",
    "system_instruction": "Use tags to separate response and after give the final response <empathetic></empathetic>final_response. Use sensitive, supportive phrasing.",
    "example": "Use \"empathetic\" for supportive communication.",
    "enabled": true
  }
];

// Get all triggers (built-in + custom)
export const getAllTriggers = (): Trigger[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const customTriggers = JSON.parse(stored) as Trigger[];
      // Merge built-in with custom, custom takes precedence
      const triggerMap = new Map<string, Trigger>();
      BUILT_IN_TRIGGERS.forEach(t => triggerMap.set(t.trigger.toLowerCase(), t));
      customTriggers.forEach(t => triggerMap.set(t.trigger.toLowerCase(), t));
      return Array.from(triggerMap.values());
    }
    return BUILT_IN_TRIGGERS;
  } catch (error) {
    console.error('Error loading triggers:', error);
    return BUILT_IN_TRIGGERS;
  }
};

// Save triggers
export const saveTriggers = (triggers: Trigger[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(triggers));
  } catch (error) {
    console.error('Error saving triggers:', error);
  }
};

// Add new trigger
export const addTrigger = (trigger: Trigger) => {
  const triggers = getAllTriggers();
  const exists = triggers.some(t => t.trigger.toLowerCase() === trigger.trigger.toLowerCase());
  if (exists) {
    throw new Error('Trigger already exists');
  }
  triggers.push({ ...trigger, custom: true });
  saveTriggers(triggers);
};

// Update trigger
export const updateTrigger = (oldTrigger: string, newTrigger: Trigger) => {
  const triggers = getAllTriggers();
  const index = triggers.findIndex(t => t.trigger.toLowerCase() === oldTrigger.toLowerCase());
  if (index !== -1) {
    triggers[index] = newTrigger;
    saveTriggers(triggers);
  }
};

// Delete trigger (only custom ones)
export const deleteTrigger = (triggerName: string) => {
  const triggers = getAllTriggers();
  const filtered = triggers.filter(t => 
    t.trigger.toLowerCase() !== triggerName.toLowerCase() || !t.custom
  );
  saveTriggers(filtered);
};

// Toggle trigger enabled state
export const toggleTrigger = (triggerName: string) => {
  const triggers = getAllTriggers();
  const trigger = triggers.find(t => t.trigger.toLowerCase() === triggerName.toLowerCase());
  if (trigger) {
    trigger.enabled = !trigger.enabled;
    saveTriggers(triggers);
  }
};

// Export triggers as JSON
export const exportTriggers = () => {
  const triggers = getAllTriggers();
  const dataStr = JSON.stringify(triggers, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `onyxgpt-triggers-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

// Import triggers from JSON
export const importTriggers = (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as Trigger[];
        saveTriggers(imported);
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

// Detect triggers in user message and build system prompt
export const detectTriggersAndBuildPrompt = (userMessage: string): { systemPrompt: string; detectedTriggers: string[] } => {
  const triggers = getAllTriggers().filter(t => t.enabled);
  const detectedTriggers: string[] = [];
  const instructions: string[] = [];

  const lowerMessage = userMessage.toLowerCase();

  // Check for each trigger
  triggers.forEach(trigger => {
    // Match whole words or phrases
    const regex = new RegExp(`\\b${trigger.trigger.toLowerCase()}\\b`, 'i');
    if (regex.test(lowerMessage)) {
      detectedTriggers.push(trigger.trigger);
      instructions.push(`${trigger.trigger} means ${trigger.system_instruction}`);
    }
  });

  // Build system prompt
  let systemPrompt = '';
  if (instructions.length > 0) {
    systemPrompt = instructions.join(' ') + '\n\nFor';
  } else {
    // Default instruction
    systemPrompt = 'default means Respond helpfully, truthfully, and concisely.\n\nFor';
  }

  return { systemPrompt, detectedTriggers };
};

// Reset to built-in triggers
export const resetToBuiltIn = () => {
  saveTriggers(BUILT_IN_TRIGGERS);
};
