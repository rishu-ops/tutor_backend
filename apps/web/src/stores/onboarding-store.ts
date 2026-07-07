'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StudentOnboardingData {
  step: number;
  name: string;
  city: string;
  studentClass: string;
  school: string;
  preferredLanguage: string;
  learningModes: string[]; // Home Tuition, Online, Group Classes
}

interface TutorSubject {
  subject: string;
  level: string;
  experienceYears: number;
}

interface TutorQualification {
  degree: string;
  institution: string;
  year: string;
}

interface TutorOnboardingData {
  step: number;
  name: string;
  city: string;
  bio: string;
  subjects: TutorSubject[];
  teachingModes: string[]; // Home Tuition, Online, Group Classes, Coaching Center
  languages: string[]; // English, Hindi, Other
  minPrice: string;
  maxPrice: string;
  feeType: string; // Per Hour, Per Month, Per Session
  qualifications: TutorQualification[];
  availability: string[]; // Weekdays, Weekends, Morning, Afternoon, Evening
}

interface OnboardingStore {
  student: StudentOnboardingData;
  tutor: TutorOnboardingData;
  setStudentField: (key: keyof StudentOnboardingData, value: any) => void;
  setTutorField: (key: keyof TutorOnboardingData, value: any) => void;
  resetOnboarding: () => void;
}

const initialStudentState: StudentOnboardingData = {
  step: 1,
  name: '',
  city: '',
  studentClass: '',
  school: '',
  preferredLanguage: '',
  learningModes: ['Online'],
};

const initialTutorState: TutorOnboardingData = {
  step: 1,
  name: '',
  city: '',
  bio: '',
  subjects: [{ subject: '', level: '', experienceYears: 1 }],
  teachingModes: ['Online'],
  languages: ['English'],
  minPrice: '',
  maxPrice: '',
  feeType: 'Per Hour',
  qualifications: [],
  availability: ['Weekdays', 'Weekends'],
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      student: initialStudentState,
      tutor: initialTutorState,

      setStudentField: (key, value) =>
        set((state) => ({
          student: {
            ...state.student,
            [key]: value,
          },
        })),

      setTutorField: (key, value) =>
        set((state) => ({
          tutor: {
            ...state.tutor,
            [key]: value,
          },
        })),

      resetOnboarding: () =>
        set({
          student: initialStudentState,
          tutor: initialTutorState,
        }),
    }),
    {
      name: 'project-tutor-onboarding-draft',
    }
  )
);
