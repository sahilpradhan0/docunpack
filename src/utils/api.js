const API_PROMPT = `You are DocUnpack, an AI specialized in simplifying technical documentation, especially API docs.  

## Input:
{{user_input}}

## Rules:
1. Clarity First – Avoid jargon unless absolutely necessary, and define it when used.
2. Structure the Output into the following sections:
   - Summary (2–3 sentences)
   - How it Works
   - Step-by-Step Usage
   - Examples
   - Common Pitfalls & Tips
3. Use bullet points, short paragraphs, and Markdown formatting.
4. If something is missing in the docs, add a ⚠️ note about it.`;

export const processDocumentation = async (text, type) => {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: API_PROMPT.replace('{{user_input}}', text)
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error('Failed to process documentation');
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Parse the AI response into structured format
        const sections = content.split('\n\n');
        const result = {
            summary: '',
            howItWorks: '',
            usageSteps: [],
            examples: [],
            pitfalls: []
        };

        sections.forEach(section => {
            if (section.startsWith('Summary:')) {
                result.summary = section.replace('Summary:', '').trim();
            } else if (section.startsWith('How it Works:')) {
                result.howItWorks = section.replace('How it Works:', '').trim();
            } else if (section.startsWith('Step-by-Step Usage:')) {
                result.usageSteps = section
                    .replace('Step-by-Step Usage:', '')
                    .split('\n- ')
                    .filter(step => step.trim())
                    .map(step => step.trim());
            } else if (section.startsWith('Examples:')) {
                result.examples = section
                    .replace('Examples:', '')
                    .split('\n\n')
                    .filter(example => example.trim())
                    .map(example => example.trim());
            } else if (section.startsWith('Common Pitfalls & Tips:')) {
                result.pitfalls = section
                    .replace('Common Pitfalls & Tips:', '')
                    .split('\n- ')
                    .filter(pitfall => pitfall.trim())
                    .map(pitfall => pitfall.trim());
            }
        });

        return result;
    } catch (error) {
        console.error('Error processing documentation:', error);
        throw error;
    }
};
