import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export type ResumeData = {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    website?: string;
  };
  summary: string;
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    location: string;
    bullets: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    startDate: string;
    endDate: string;
    location: string;
  }>;
  certifications: string[];
  skills: string[];
};

const resumeSchema = {
  type: Type.OBJECT,
  properties: {
    personalInfo: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        email: { type: Type.STRING },
        phone: { type: Type.STRING },
        location: { type: Type.STRING },
        linkedin: { type: Type.STRING },
        website: { type: Type.STRING },
      },
      required: ["name", "email", "phone", "location"],
    },
    summary: { type: Type.STRING },
    experience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          company: { type: Type.STRING },
          position: { type: Type.STRING },
          startDate: { type: Type.STRING },
          endDate: { type: Type.STRING },
          location: { type: Type.STRING },
          bullets: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["company", "position", "startDate", "endDate", "bullets"],
      },
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          institution: { type: Type.STRING },
          degree: { type: Type.STRING },
          startDate: { type: Type.STRING },
          endDate: { type: Type.STRING },
          location: { type: Type.STRING },
        },
        required: ["institution", "degree", "startDate", "endDate"],
      },
    },
    certifications: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    skills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ["personalInfo", "summary", "experience", "education", "certifications", "skills"],
};

export async function parseResumeStructure(rawText: string): Promise<ResumeData> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extract the information from this resume and map it to a JSON schema. 
    CRITICAL: You MUST return a JSON object containing ALL sections: personalInfo, summary, experience, education, certifications, and skills. Never omit a section.
    Ensure every work experience entry has exactly 3-4 bullet points. Combine or split as needed.
    Only use these sections: Summary, Experience, Education, Certifications, and Skills.
    DATA INTEGRITY: In the JSON output, the 'phone' field MUST be formatted exactly as (682) 556-5976 and the 'location' field MUST contain only the city/state (e.g., FL). Do not swap these.
    CURRENT JOBS: If a job is current (e.g., Mercor), the 'endDate' MUST be an empty string "". Do not include "Present".
    
    Resume Text:
    ${rawText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: resumeSchema,
      temperature: 0.1,
    },
  });
  
  return JSON.parse(response.text || "{}") as ResumeData;
}

export async function tailorResumeDraft(parsedResume: ResumeData, jobRequirements: string): Promise<ResumeData> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Tailor this resume to the job requirements.
    
    STRICT CONTENT RULES:
    1. SUMMARY: Write a concise professional summary of 2-3 sentences (approx. 40-50 words). Focus on key expertise and specific technical keywords.
    2. EXPERIENCE: Every job MUST have exactly 3-4 high-impact bullet points. 
    3. BULLET LENGTH: Keep bullets very concise (max 18 words per bullet).
    4. ALL SECTIONS: You MUST include personalInfo, summary, experience, education, certifications, and skills.
    5. PERSONAL INFO: DO NOT change or swap the personalInfo fields. In the JSON output, the 'phone' field MUST be formatted exactly as (682) 556-5976 and the 'location' field MUST contain only the city/state (e.g., FL).
    6. CURRENT JOBS: If a job is current (e.g., Mercor), the 'endDate' MUST be an empty string "". Do not include "Present".
    7. ONE PAGE RULE: The total content must be short enough to fit on a single A4 page. Be ruthless with word choice.
    
    Job Requirements: ${jobRequirements}
    Resume JSON: ${JSON.stringify(parsedResume)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: resumeSchema,
      temperature: 0.3,
    },
  });
  
  return JSON.parse(response.text || "{}") as ResumeData;
}

export async function reviewAndSelfCorrect(draftResume: ResumeData, jobRequirements: string): Promise<ResumeData> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Critically review this tailored resume. 
    
    STRICT CHECKLIST:
    1. Are ALL sections present (Summary, Experience, Education, Certifications, Skills)?
    2. Is the SUMMARY between 40-50 words?
    3. Does every job have EXACTLY 3-4 bullet points?
    4. Is every bullet point under 18 words?
    5. DATA INTEGRITY: Are the personalInfo fields correct? (Check that phone and location are not swapped). The 'phone' field MUST be formatted exactly as (682) 556-5976 and the 'location' field MUST contain only the city/state (e.g., FL).
    6. CURRENT JOBS: Verify that current jobs (like Mercor) have an empty string "" as the 'endDate'.
    7. Is the content perfectly tailored to the job requirements?
    8. ONE PAGE FIT: This MUST fit on one page. If it looks too long, cut words and bullets immediately. Limit to top 3 most relevant jobs if necessary.
    
    Rewrite the JSON to comply with all rules. Do not omit sections.
    
    Job Requirements:
    ${jobRequirements}
    
    Draft Tailored Resume JSON:
    ${JSON.stringify(draftResume)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: resumeSchema,
      temperature: 0.2,
    },
  });
  
  return JSON.parse(response.text || "{}") as ResumeData;
}
