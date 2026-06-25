import { CapabilityCard } from "./types";

export const CAPABILITY_CARDS: CapabilityCard[] = [
  {
    id: "study",
    title: "Study & Tutoring",
    description: "Break down difficult academic concepts, design learning schedules, or build quizzes.",
    iconName: "GraduationCap",
    prompts: [
      "Explain the concept of quantum superposition in simple, everyday terms.",
      "Create a structured 4-week study syllabus for learning introductory macroeconomics.",
      "Test my knowledge of the French Revolution with three engaging multiple-choice questions."
    ],
    colorTheme: {
      bg: "bg-amber-50/50",
      border: "border-amber-100",
      iconBg: "bg-amber-100/60",
      iconColor: "text-amber-800",
      hoverBg: "hover:bg-amber-100/20"
    }
  },
  {
    id: "science",
    title: "Science & Medicine",
    description: "Explore biological structures, physical laws, and general scientific education.",
    iconName: "Activity",
    prompts: [
      "How does the human body's adaptive immune system remember past viruses?",
      "Explain the biochemical pathway of cellular respiration step-by-step.",
      "What is the theory of general relativity, and how does gravity bend light?"
    ],
    colorTheme: {
      bg: "bg-teal-50/50",
      border: "border-teal-100",
      iconBg: "bg-teal-100/60",
      iconColor: "text-teal-800",
      hoverBg: "hover:bg-teal-100/20"
    }
  },
  {
    id: "coding",
    title: "Coding & Tech",
    description: "Write code templates, explain technical patterns, or debug errors.",
    iconName: "Code",
    prompts: [
      "Write a TypeScript generic hook to fetch data from an API with loading and error states.",
      "Explain how database indexes work and why they speed up queries.",
      "Contrast client-side rendering (CSR) and server-side rendering (SSR) trade-offs."
    ],
    colorTheme: {
      bg: "bg-indigo-50/50",
      border: "border-indigo-100",
      iconBg: "bg-indigo-100/60",
      iconColor: "text-indigo-800",
      hoverBg: "hover:bg-indigo-100/20"
    }
  },
  {
    id: "writing",
    title: "Writing & Connect",
    description: "Draft professional messages, refine essays, or structure arguments.",
    iconName: "PenTool",
    prompts: [
      "Help me draft a warm, respectful follow-up email to a potential startup advisor.",
      "Rewrite a simple cover letter paragraph to make it sound highly proactive and confident.",
      "Suggest three title hook variations for an article about mindful morning routines."
    ],
    colorTheme: {
      bg: "bg-rose-50/50",
      border: "border-rose-100",
      iconBg: "bg-rose-100/60",
      iconColor: "text-rose-800",
      hoverBg: "hover:bg-rose-100/20"
    }
  },
  {
    id: "business",
    title: "Launch Business",
    description: "Brainstorm strategic steps, write elevator pitches, or draft business canvases.",
    iconName: "Briefcase",
    prompts: [
      "Provide a lean canvas business plan outline for a local zero-waste grocery delivery service.",
      "What are five critical customer validation questions to ask before building a product?",
      "Draft an elevator pitch for a mobile app that helps local farmers sell surplus organic produce."
    ],
    colorTheme: {
      bg: "bg-emerald-50/50",
      border: "border-emerald-100",
      iconBg: "bg-emerald-100/60",
      iconColor: "text-emerald-800",
      hoverBg: "hover:bg-emerald-100/20"
    }
  },
  {
    id: "productivity",
    title: "Productivity & Goals",
    description: "Organize busy schedules, design solid habit loops, and define actionable OKRs.",
    iconName: "CheckSquare",
    prompts: [
      "How can I set up a structured, distration-free daily schedule for deep focus work?",
      "Design a sustainable morning habit loop to build a daily journal writing routine.",
      "Structure three personal OKRs for transitioning into a product design career over six months."
    ],
    colorTheme: {
      bg: "bg-sky-50/50",
      border: "border-sky-100",
      iconBg: "bg-sky-100/60",
      iconColor: "text-sky-800",
      hoverBg: "hover:bg-sky-100/20"
    }
  },
  {
    id: "creative",
    title: "Creative Sandbox",
    description: "Brainstorm distinctive concepts, name proposals, or storytelling narrative hooks.",
    iconName: "Sparkles",
    prompts: [
      "Brainstorm eight elegant and distinctive names for a premium, organic botanical tea brand.",
      "Give me a sci-fi short story premise centered on a silent deep-sea archaeological discovery.",
      "Provide three high-engagement video hook concepts for an online baking tutorial."
    ],
    colorTheme: {
      bg: "bg-violet-50/50",
      border: "border-violet-100",
      iconBg: "bg-violet-100/60",
      iconColor: "text-violet-800",
      hoverBg: "hover:bg-violet-100/20"
    }
  }
];
