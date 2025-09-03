// --- IMPORTS AND SETUP ---
const DB_NAME = 'QuizVaultDB';
const DB_VERSION = 1;

// --- INTERFACES ---
export interface Subject {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
}
export interface AnswerOption {
  text: string;
  isCorrect: boolean;
}
export interface Question {
  question: string;
  answerOptions: AnswerOption[];
}
export interface Quiz {
  id: string;
  title: string;
  subjectId: string;
  createdAt: Date;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  type?: 'Numerical' | 'Theory';
  questions: Question[];
}
export interface AnsweredQuestion {
  question: string;
  userAnswer: string;
  userIsCorrect: boolean;
  correctAnswer: string;
}
export interface QuizResult {
  id: string;
  quizId: string;
  subjectId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  answeredQuestions: AnsweredQuestion[];
  startTime: Date;
  completedAt: Date;
}
export interface QuizData {
  title: string;
  questions: Question[];
  subjectId: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  type?: 'Numerical' | 'Theory';
}
export interface QuizResultData {
  quizId: string;
  subjectId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  answeredQuestions: AnsweredQuestion[];
  startTime: Date;
  completedAt: Date;
}

let db: IDBDatabase | null = null;
let isPreloading = false;

// --- PRELOAD FUNCTION (WITH ANSWERS LOGIC RESTORED) ---
async function preloadData() {
  if (isPreloading) return;
  isPreloading = true;
  try {
    const isPreloaded = localStorage.getItem('isDataPreloaded');
    if (isPreloaded) return;

    // Step 1: Preload Subjects
    const subjectsToCreate = [
      { name: 'EVS Water Supply', description: 'Quizzes related to Environmental Science.' },
      //{ name: 'Design of Concrete', description: 'Quizzes about concrete design.' },
      { name: 'Water treatment', description: 'Quizzes about treatment.' }
    ];
    for (const subjectData of subjectsToCreate) {
      await createSubject(subjectData);
    }
    const allSubjects = await getAllSubjects();

    // Step 2: Preload Quizzes
    const quizModules = import.meta.glob('../data/quizzes/*.json');
    for (const path in quizModules) {
      const module: any = await quizModules[path]();
      const quizJson = module.default;
      const parentSubject = allSubjects.find(s => s.name === quizJson.subjectName);
      if (parentSubject) {
        await createQuiz({
          title: quizJson.title,
          questions: quizJson.questions,
          subjectId: parentSubject.id,
          difficulty: quizJson.difficulty,
          type: quizJson.type
        });
      }
    }

    // Step 3: Preload Answers (THIS SECTION WAS MISSING)
    const allQuizzes = (await Promise.all(allSubjects.map(s => getQuizzesBySubject(s.id)))).flat();
    const answerModules = import.meta.glob('../data/answers/*.json');
    for (const path in answerModules) {
        const module: any = await answerModules[path]();
        const answerJson = module.default;
        const targetQuiz = allQuizzes.find(q => q.title === answerJson.quizTitle);
        if (targetQuiz) {
            const correctCount = answerJson.answeredQuestions.filter((q: AnsweredQuestion) => q.userIsCorrect).length;
            const score = (correctCount / targetQuiz.questions.length) * 100;
            await saveQuizResult({
                quizId: targetQuiz.id,
                subjectId: targetQuiz.subjectId,
                score: score,
                totalQuestions: targetQuiz.questions.length,
                correctAnswers: correctCount,
                answeredQuestions: answerJson.answeredQuestions,
                startTime: new Date(),
                completedAt: new Date()
            });
        }
    }

    localStorage.setItem('isDataPreloaded', 'true');
  } catch (error) {
    console.error('Failed to preload data:', error);
  } finally {
    isPreloading = false;
  }
}

// --- INITIALIZE DB ---
export async function initializeDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      preloadData().then(() => resolve());
    };
    request.onupgradeneeded = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('subjects')) {
        db.createObjectStore('subjects', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('quizzes')) {
        const qs = db.createObjectStore('quizzes', { keyPath: 'id' });
        qs.createIndex('subjectId', 'subjectId', { unique: false });
      }
      if (!db.objectStoreNames.contains('quizResults')) {
        const rs = db.createObjectStore('quizResults', { keyPath: 'id' });
        rs.createIndex('quizId', 'quizId', { unique: false });
        rs.createIndex('subjectId', 'subjectId', { unique: false });
      }
    };
  });
}

// --- ALL DATABASE FUNCTIONS ---
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export async function createSubject(data: Omit<Subject, 'id' | 'createdAt'>): Promise<Subject> {
  if (!db) await initializeDB();
  const subject: Subject = { id: generateId(), ...data, createdAt: new Date() };
  return new Promise((resolve, reject) => {
    const tx = db!.transaction('subjects', 'readwrite');
    tx.objectStore('subjects').add(subject);
    tx.oncomplete = () => resolve(subject);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllSubjects(): Promise<Subject[]> {
  if (!db) await initializeDB();
  return new Promise((resolve, reject) => {
    const req = db!.transaction('subjects', 'readonly').objectStore('subjects').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getSubject(id: string): Promise<Subject | null> {
    if (!db) await initializeDB();
    return new Promise((resolve, reject) => {
        const request = db!.transaction('subjects', 'readonly').objectStore('subjects').get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function createQuiz(data: QuizData): Promise<Quiz> {
    if (!db) await initializeDB();
    const quiz: Quiz = { id: generateId(), ...data, createdAt: new Date() };
    return new Promise((resolve, reject) => {
        const tx = db!.transaction('quizzes', 'readwrite');
        tx.objectStore('quizzes').add(quiz);
        tx.oncomplete = () => resolve(quiz);
        tx.onerror = () => reject(tx.error);
    });
}

export async function getQuiz(id: string): Promise<Quiz | null> {
    if (!db) await initializeDB();
    return new Promise((resolve, reject) => {
        const request = db!.transaction('quizzes', 'readonly').objectStore('quizzes').get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function getQuizzesBySubject(subjectId: string): Promise<Quiz[]> {
    if (!db) await initializeDB();
    return new Promise((resolve, reject) => {
        const index = db!.transaction('quizzes', 'readonly').objectStore('quizzes').index('subjectId');
        const request = index.getAll(subjectId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function saveQuizResult(data: QuizResultData): Promise<QuizResult> {
  if (!db) await initializeDB();
  const result: QuizResult = { id: generateId(), ...data, completedAt: new Date() };
  return new Promise((resolve, reject) => {
    const tx = db!.transaction('quizResults', 'readwrite');
    tx.objectStore('quizResults').add(result);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQuizResult(id: string): Promise<QuizResult | null> {
  if (!db) await initializeDB();
  return new Promise((resolve, reject) => {
      const request = db!.transaction('quizResults', 'readonly').objectStore('quizResults').get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
  });
}

export async function getQuizResultsBySubject(subjectId: string): Promise<QuizResult[]> {
    if (!db) await initializeDB();
    return new Promise((resolve, reject) => {
        const index = db!.transaction('quizResults', 'readonly').objectStore('quizResults').index('subjectId');
        const request = index.getAll(subjectId);
        request.onsuccess = () => {
            const results = request.result.sort((a,b) => b.completedAt.getTime() - a.completedAt.getTime());
            resolve(results);
        }
        request.onerror = () => reject(request.error);
    });
}

export async function getSubjectStats(subjectId: string): Promise<{
  totalQuizzes: number;
  averageScore: number;
  totalAttempts: number;
}> {
  const [quizzes, results] = await Promise.all([
    getQuizzesBySubject(subjectId),
    getQuizResultsBySubject(subjectId)
  ]);
  const totalQuizzes = quizzes.length;
  const totalAttempts = results.length;
  const averageScore = results.length > 0
    ? results.reduce((sum, result) => sum + result.score, 0) / results.length
    : 0;
  return {
    totalQuizzes,
    averageScore,
    totalAttempts
  };
}