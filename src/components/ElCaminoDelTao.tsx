import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Lock,
  Check,
  Star,
  ChevronRight,
  ArrowLeft,
  Heart,
  Flame,
  Trophy,
  Sparkles,
  BookOpen,
  ScrollText,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type ViewState = "map" | "unit" | "lessonStart" | "quiz" | "result";

interface Question {
  id: string;
  type: string;
  prompt: string;
  context?: string;
  source?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  duration: string;
  difficulty: "Easy" | "Medium" | "Advanced";
  skills: string[];
  reward: {
    xp: number;
    badge: string;
  };
  checkpoint?: boolean;
  questions: Question[];
}

interface Unit {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  description: string;
  cover: string;
  status: "available" | "preview";
  lessons: Lesson[];
}

interface LessonProgress {
  completed: boolean;
  bestScore: number;
  mastery: number;
  bestXp: number;
}

const createPreviewLessons = (
  prefix: string,
  defs: Array<{ title: string; subtitle: string; icon: string }>
): Lesson[] =>
  defs.map((lesson, idx) => ({
    id: `${prefix}-lesson-${idx + 1}`,
    title: lesson.title,
    subtitle: lesson.subtitle,
    icon: lesson.icon,
    duration: "3 min",
    difficulty: idx < 2 ? "Easy" : idx < 4 ? "Medium" : "Advanced",
    skills: ["课程设计中", "即将开放", "主题式学习"],
    reward: { xp: 25, badge: "Vista previa" },
    checkpoint: idx === defs.length - 1,
    questions: [],
  }));

const UNIT_1_LESSONS: Lesson[] = [
  {
    id: "u1-l1",
    title: "识字与词义",
    subtitle: "Vocabulario esencial del Capitulo 1",
    icon: "🈶",
    duration: "3 min",
    difficulty: "Easy",
    skills: ["Dao / Ming / You / Wu", "Pinyin basico", "Relacion espanol-chino"],
    reward: { xp: 20, badge: "Primeros caracteres" },
    questions: [
      {
        id: "u1-l1-q1",
        type: "Chinese -> Spanish",
        prompt: 'Para un estudiante novato, cual es la traduccion basica mas util de “道” (dao)?',
        options: ["El Camino", "La Montaña", "El Mercado", "El Palacio"],
        correctIndex: 0,
        explanation: 'En esta primera unidad, “dao” se presenta al nivel mas basico como “El Camino”, porque ayuda al estudiante a entrar en el campo semantico sin perderse.',
      },
      {
        id: "u1-l1-q2",
        type: "Character meaning",
        prompt: 'En el Capitulo 1, “名” (ming) se acerca mas a que idea?',
        options: ["Nombre / nombrar", "Tierra", "Silencio", "Agua"],
        correctIndex: 0,
        explanation: 'En “名可名，非常名”, “ming” no solo significa nombre. Tambien implica nombrar, definir y fijar algo con palabras.',
      },
      {
        id: "u1-l1-q3",
        type: "Pinyin",
        prompt: 'Cual es el pinyin correcto de “无”?',
        options: ["yǒu", "wú", "míng", "xuán"],
        correctIndex: 1,
        explanation: '“无” se lee “wu”. En el Capitulo 1 aparece en contraste con “有” (you), y juntos forman una de las relaciones clave del texto.',
      },
      {
        id: "u1-l1-q4",
        type: "Concept match",
        prompt: 'Si lees “有名万物之母”, en este contexto de estudio que significa mejor “有” (you)?',
        options: ["El plano de lo nombrado y manifiesto", "Silencio puro", "Naturaleza y montanas", "Una negacion"],
        correctIndex: 0,
        explanation: 'Aqui “you” no significa simplemente “tener”. Se refiere al plano de lo que aparece, se nombra y se reconoce en el mundo.',
      },
    ],
  },
  {
    id: "u1-l2",
    title: "句义理解",
    subtitle: "Comprension de frases clave de Dao ke dao",
    icon: "📜",
    duration: "4 min",
    difficulty: "Easy",
    skills: ["Comprension global", "Idea central", "Relaciones conceptuales"],
    reward: { xp: 25, badge: "Lector inicial" },
    questions: [
      {
        id: "u1-l2-q1",
        type: "Meaning check",
        prompt: 'Cual de estas opciones explica mejor “道可道，非常道”?',
        options: [
          "El dao que puede decirse por completo no es el dao constante",
          "Solo los reyes pueden explicar el dao",
          "El lenguaje no sirve para nada",
          "El dao es una carretera concreta",
        ],
        correctIndex: 0,
        explanation: "La frase no rechaza el lenguaje. Lo que dice es que, cuando el dao queda fijado por completo en palabras, ya no es el dao permanente.",
      },
      {
        id: "u1-l2-q2",
        type: "Sentence meaning",
        prompt: 'Que idea central expresa “无名天地之始”?',
        options: [
          "Lo innombrado es destruccion final",
          "Lo no nombrado es el origen del cielo y la tierra",
          "Solo el cielo tiene nombre",
          "El ser humano no debe nombrar nada",
        ],
        correctIndex: 1,
        explanation: '“Wu ming” significa lo que todavia no ha sido fijado por un nombre. Es una forma de hablar del origen, antes de toda clasificacion.',
      },
      {
        id: "u1-l2-q3",
        type: "Sentence meaning",
        prompt: 'En “有名万物之母”, la palabra “母” (madre) funciona sobre todo como:',
        options: ["Guerra", "Juicio moral", "Fuente generadora", "Sistema politico"],
        correctIndex: 2,
        explanation: '“Madre” no se usa aqui en sentido familiar cotidiano, sino como imagen del origen que engendra y hace aparecer las cosas.',
      },
      {
        id: "u1-l2-q4",
        type: "Summary choice",
        prompt: 'Como resumen, “玄之又玄，众妙之门” apunta sobre todo a:',
        options: [
          "La profundidad misteriosa del dao y su acceso a multiples sentidos",
          "Una opinion sobre la guerra",
          "Una tecnica agricola antigua",
          "Una critica al protocolo imperial",
        ],
        correctIndex: 0,
        explanation: "Es el cierre poetico del capitulo: el dao se presenta como una profundidad inagotable y como puerta de muchas maravillas.",
      },
    ],
  },
  {
    id: "u1-l3",
    title: "译本辨析",
    subtitle: "Comparar estrategias de traduccion al espanol",
    icon: "⚖️",
    duration: "4 min",
    difficulty: "Medium",
    skills: ["Camino vs Tao", "Domesticacion / extranjerizacion", "Estilo del traductor"],
    reward: { xp: 30, badge: "Traductor aprendiz" },
    questions: [
      {
        id: "u1-l3-q1",
        type: "Translation strategy",
        prompt: 'Si un traductor conserva “道” como “Tao”, a que estrategia se acerca mas?',
        options: ["Extranjerización", "Domesticación", "Paráfrasis libre", "Humor lingüístico"],
        correctIndex: 0,
        explanation: 'Mantener “Tao” deja mas visible la diferencia cultural del termino original. Por eso suele acercarse a la extranjerizacion.',
      },
      {
        id: "u1-l3-q2",
        type: "Translation comparison",
        prompt: 'Traducir “道” como “El Camino” suele sonar mas a:',
        options: ["Domesticación", "Extranjerización", "Silencio semántico", "Transcripción fonética"],
        correctIndex: 0,
        explanation: '“El Camino” acerca el concepto al lector hispanohablante y facilita la comprension inicial. Por eso se percibe como una solucion mas domesticadora.',
      },
      {
        id: "u1-l3-q3",
        type: "Translation nuance",
        prompt: 'Entre “No-accion” y “sin actuar”, cual suena mas como concepto fijado o termino tecnico?',
        options: ["No-accion", "Sin actuar", "Son exactamente iguales", "Ninguno"],
        correctIndex: 0,
        explanation: '“No-accion” suena mas nominal, mas parecido a una etiqueta conceptual. “Sin actuar” conserva mejor la sensacion de proceso o modo de actuar.',
      },
      {
        id: "u1-l3-q4",
        type: "Reader impact",
        prompt: 'Para un lector novato, la diferencia principal entre “Camino” y “Tao” suele ser:',
        options: [
          "El primero resulta mas cercano y el segundo conserva mas extrañeza cultural",
          "El primero es siempre mas mistico y el segundo mas coloquial",
          "El primero solo sirve para textos budistas",
          "No hay ninguna diferencia",
        ],
        correctIndex: 0,
        explanation: '“Camino” mejora la entrada del lector principiante. “Tao” mantiene mas la textura original del concepto chino.',
      },
    ],
  },
  {
    id: "u1-l4",
    title: "概念应用",
    subtitle: "Aplicar la idea de dao y nombre a situaciones reales",
    icon: "🧭",
    duration: "5 min",
    difficulty: "Medium",
    skills: ["Transferencia conceptual", "Juicio situacional", "Marco taoista"],
    reward: { xp: 35, badge: "Pensador sereno" },
    questions: [
      {
        id: "u1-l4-q1",
        type: "Scenario",
        prompt: 'Si en un equipo aparece una idea nueva pero aun difusa, que actitud encaja mejor con “道可道，非常道”?',
        options: [
          "Dejar espacio para observarla antes de fijarla con etiquetas",
          "Definirla de inmediato con reglas rigidas y KPI cerrados",
          "Rechazarla porque aun no esta clara",
          "Copiar solo el nombre que usa la competencia",
        ],
        correctIndex: 0,
        explanation: "Una lectura contemporanea de esta frase sugiere que nombrar demasiado pronto puede limitar el desarrollo vivo de una idea.",
      },
      {
        id: "u1-l4-q2",
        type: "Reflection",
        prompt: "Si tienes la costumbre de poner etiquetas rapidas a las personas, que problema del Capitulo 1 aparece aqui?",
        options: [
          "Confundir el nombre con la realidad total de la persona",
          "Dar demasiada importancia al ejercicio",
          "Hablar demasiado poco",
          "Ignorar el clima",
        ],
        correctIndex: 0,
        explanation: "El texto recuerda que el nombre solo captura una parte. Cuando una etiqueta ocupa todo, la realidad queda empobrecida.",
      },
      {
        id: "u1-l4-q3",
        type: "Real-life Tao",
        prompt: "Ante una experiencia nueva que aun no sabes explicar bien, cual seria una actitud mas taoista?",
        options: [
          "Observar primero y comprender poco a poco",
          "Forzarla enseguida dentro de una categoria conocida",
          "Ignorarla por completo",
          "Aceptar solo una respuesta unica y cerrada",
        ],
        correctIndex: 0,
        explanation: "La mirada taoista privilegia la observacion y la comprension gradual, no la necesidad de cerrar todo con rapidez.",
      },
      {
        id: "u1-l4-q4",
        type: "Applied meaning",
        prompt: 'Si piensas “众妙之门” como idea de producto, cual de estas direcciones encaja mejor?',
        options: [
          "Dar al usuario una entrada hacia varios niveles de sentido",
          "Hacer que todas las preguntas tengan una unica lectura rigida",
          "Dejar la interfaz solo en texto plano",
          "Separar totalmente cada capitulo sin relacion entre si",
        ],
        correctIndex: 0,
        explanation: '“Puerta de las muchas maravillas” funciona muy bien como idea de diseno: una entrada sencilla que abre capas cada vez mas profundas de comprension.',
      },
    ],
  },
  {
    id: "u1-l5",
    title: "Boss Checkpoint",
    subtitle: "Repaso final: vocabulario, sentido, traduccion y aplicacion",
    icon: "🏆",
    duration: "5 min",
    difficulty: "Advanced",
    skills: ["Repaso global", "Deteccion de debilidades", "Unit mastery"],
    reward: { xp: 50, badge: "Guardian of Dao" },
    checkpoint: true,
    questions: [
      {
        id: "u1-l5-q1",
        type: "Mixed review",
        prompt: 'Cual de estas frases resume mejor “道可道，非常道”?',
        options: [
          "El dao ultimo no puede quedar fijado por completo en una formula verbal",
          "El lenguaje no vale nada",
          "La verdad pertenece solo a unos pocos",
          "Los caminos fisicos son mas importantes que los nombres",
        ],
        correctIndex: 0,
        explanation: "La frase no destruye el lenguaje; simplemente recuerda que lo absoluto excede cualquier formulacion definitiva.",
      },
      {
        id: "u1-l5-q2",
        type: "Mixed review",
        prompt: 'Si quieres conservar la extrañeza cultural del concepto “道”, que opcion elegirias?',
        options: ["Tao", "Camino", "Sendero", "Ruta diaria"],
        correctIndex: 0,
        explanation: 'La forma “Tao” mantiene mas visible la procedencia cultural del concepto y su tono no domestico.',
      },
      {
        id: "u1-l5-q3",
        type: "Mixed review",
        prompt: "Cual es el aprendizaje conceptual mas importante de esta unidad?",
        options: [
          "El nombre es una puerta de entrada, no toda la realidad",
          "Todos los conceptos deben rechazarse",
          "Solo lo innombrado tiene valor",
          "La filosofia no sirve para la vida real",
        ],
        correctIndex: 0,
        explanation: "La unidad enseña una mirada por capas: nombrar ayuda, pero no agota lo real.",
      },
      {
        id: "u1-l5-q4",
        type: "Mixed review",
        prompt: 'Si una persona explora mucho “道 / 名 / 无 / 有” en la zona de lectura, que deberia reforzar mejor este checkpoint?',
        options: [
          "Pasar del significado de palabras a una red conceptual del capitulo",
          "Memorizar solo ortografia en espanol",
          "Hacer solo una prueba de velocidad",
          "No ofrecer ninguna explicacion",
        ],
        correctIndex: 0,
        explanation: "Un buen checkpoint no se limita a vocabulario aislado; une palabras, frases, traducciones y conceptos en una comprension mas completa.",
      },
    ],
  },
];

const COURSE: { title: string; subtitle: string; units: Unit[] } = {
  title: "El Camino del Tao",
  subtitle: "Sistema bilingue de aprendizaje taoista",
  units: [
    {
      id: "unit-1",
      title: "道与名",
      subtitle: "El Tao y el Nombre",
      icon: "🌌",
      description: "从《道可道，非常道》出发，建立“道”与“命名”的第一层理解。",
      cover: "从不可言说走向可学习的第一道门。",
      status: "available",
      lessons: UNIT_1_LESSONS,
    },
    {
      id: "unit-2",
      title: "有与无",
      subtitle: "Ser y No-ser",
      icon: "☯️",
      description: "围绕“有无相生”，理解相反概念如何共同构成意义。",
      cover: "不是二选一，而是互相生发。",
      status: "preview",
      lessons: createPreviewLessons("u2", [
        { title: "对立入门", subtitle: "看懂有与无的基础关系", icon: "⚪" },
        { title: "句群理解", subtitle: "从章句里识别相生成对", icon: "🔁" },
        { title: "译法比较", subtitle: "比较 no-ser / ser 等表述", icon: "⚖️" },
        { title: "现实应用", subtitle: "把有无观用于日常判断", icon: "🧠" },
        { title: "Checkpoint", subtitle: "综合掌握", icon: "🏆" },
      ]),
    },
    {
      id: "unit-3",
      title: "无为",
      subtitle: "Wu Wei",
      icon: "🌊",
      description: "从误解“什么都不做”走向理解“顺势而为”。",
      cover: "最容易被误解，也最适合做应用题的单元。",
      status: "preview",
      lessons: createPreviewLessons("u3", [
        { title: "概念拆解", subtitle: "无为不是消极躺平", icon: "🪶" },
        { title: "句义训练", subtitle: "Leer actua sin actuar", icon: "📜" },
        { title: "译法差异", subtitle: "No-accion y sin actuar", icon: "⚖️" },
        { title: "场景判断", subtitle: "决策与管理中的无为", icon: "🧭" },
        { title: "Checkpoint", subtitle: "综合掌握", icon: "🏆" },
      ]),
    },
    {
      id: "unit-4",
      title: "圣人之治",
      subtitle: "Gobierno del Sabio",
      icon: "🏛️",
      description: "学习《道德经》如何谈秩序、治理与不争。",
      cover: "从个人修身进入秩序设计。",
      status: "preview",
      lessons: createPreviewLessons("u4", [
        { title: "治道词汇", subtitle: "治 / 民 / 圣人等核心词", icon: "📘" },
        { title: "治国句义", subtitle: "读懂治理相关章句", icon: "🧾" },
        { title: "译本风格", subtitle: "看不同译者如何处理政治语义", icon: "⚖️" },
        { title: "管理应用", subtitle: "转化到组织与团队管理", icon: "👥" },
        { title: "Checkpoint", subtitle: "综合掌握", icon: "🏆" },
      ]),
    },
    {
      id: "unit-5",
      title: "自然与柔弱",
      subtitle: "Naturaleza y Suavidad",
      icon: "🍃",
      description: "理解“柔弱胜刚强”的审美与处世智慧。",
      cover: "你会感受到《道德经》最具诗性的力量。",
      status: "preview",
      lessons: createPreviewLessons("u5", [
        { title: "自然词场", subtitle: "水、谷、柔、弱等意象", icon: "💧" },
        { title: "句义赏析", subtitle: "自然比喻的学习入口", icon: "🎐" },
        { title: "译文比较", subtitle: "不同译者的诗性处理", icon: "⚖️" },
        { title: "生活迁移", subtitle: "柔性应对现实冲突", icon: "🌿" },
        { title: "Checkpoint", subtitle: "综合掌握", icon: "🏆" },
      ]),
    },
    {
      id: "unit-6",
      title: "修身与处世",
      subtitle: "Cultivarse y Habitar el Mundo",
      icon: "🪞",
      description: "把前面学到的观念落实到自我、关系与长期修养。",
      cover: "课程收束于你如何与自己和世界相处。",
      status: "preview",
      lessons: createPreviewLessons("u6", [
        { title: "修身词汇", subtitle: "知足、守静、少私等概念", icon: "🕯️" },
        { title: "章句理解", subtitle: "从原文看修身路径", icon: "📜" },
        { title: "关系与表达", subtitle: "把 Taoist 观念带入沟通", icon: "💬" },
        { title: "人生场景", subtitle: "职场、亲密关系与焦虑处理", icon: "🌗" },
        { title: "Final Checkpoint", subtitle: "课程总复盘", icon: "🏆" },
      ]),
    },
  ],
};

const masteryFromAccuracy = (accuracy: number) => {
  if (accuracy >= 0.95) return 5;
  if (accuracy >= 0.85) return 4;
  if (accuracy >= 0.7) return 3;
  if (accuracy >= 0.55) return 2;
  if (accuracy > 0) return 1;
  return 0;
};

const ElCaminoDelTao = ({ isOpen, onClose }: Props) => {
  const [view, setView] = useState<ViewState>("map");
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionHearts, setSessionHearts] = useState(5);
  const [sessionXp, setSessionXp] = useState(0);
  const [sessionStreak, setSessionStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [resultMode, setResultMode] = useState<"pass" | "review">("pass");
  const [mistakes, setMistakes] = useState<Array<{ prompt: string; explanation: string }>>([]);

  const selectedUnit = useMemo(
    () => COURSE.units.find((unit) => unit.id === selectedUnitId) ?? null,
    [selectedUnitId]
  );
  const selectedLesson = useMemo(
    () => selectedUnit?.lessons.find((lesson) => lesson.id === selectedLessonId) ?? null,
    [selectedUnit, selectedLessonId]
  );

  useEffect(() => {
    if (!isOpen) {
      setView("map");
      setSelectedUnitId(null);
      setSelectedLessonId(null);
      setCurrentQ(0);
      setSelectedAnswer(null);
      setHasChecked(false);
      setCorrectCount(0);
      setSessionHearts(5);
      setSessionXp(0);
      setSessionStreak(0);
      setBestStreak(0);
      setMistakes([]);
      setResultMode("pass");
    }
  }, [isOpen]);

  const totalXp = Object.values(progress).reduce((sum, lesson) => sum + lesson.bestXp, 0);
  const masteredLessons = Object.values(progress).filter((lesson) => lesson.mastery >= 5).length;

  const isUnitUnlocked = (unitIndex: number) => {
    if (unitIndex === 0) return true;
    const prevUnit = COURSE.units[unitIndex - 1];
    return prevUnit.lessons.every((lesson) => progress[lesson.id]?.completed);
  };

  const isLessonUnlocked = (unit: Unit, lessonIndex: number) => {
    const unitIndex = COURSE.units.findIndex((item) => item.id === unit.id);
    if (!isUnitUnlocked(unitIndex)) return false;
    if (unit.status === "preview") return false;
    if (lessonIndex === 0) return true;
    return progress[unit.lessons[lessonIndex - 1].id]?.completed ?? false;
  };

  const getUnitProgress = (unit: Unit) => {
    const completed = unit.lessons.filter((lesson) => progress[lesson.id]?.completed).length;
    return { completed, total: unit.lessons.length };
  };

  const openUnit = (unitId: string) => {
    setSelectedUnitId(unitId);
    setSelectedLessonId(null);
    setView("unit");
  };

  const openLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setView("lessonStart");
  };

  const startLessonSession = () => {
        setCurrentQ(0);
        setSelectedAnswer(null);
    setHasChecked(false);
    setCorrectCount(0);
    setSessionHearts(5);
    setSessionXp(0);
    setSessionStreak(0);
    setBestStreak(0);
    setMistakes([]);
    setResultMode("pass");
    setView("quiz");
  };

  const handleCheckAnswer = () => {
    if (!selectedLesson || selectedAnswer === null || hasChecked) return;

    const question = selectedLesson.questions[currentQ];
    const isCorrect = selectedAnswer === question.correctIndex;
    setHasChecked(true);

    if (isCorrect) {
      setCorrectCount((count) => count + 1);
      setSessionXp((xp) => xp + 5);
      setSessionStreak((streak) => {
        const next = streak + 1;
        setBestStreak((best) => Math.max(best, next));
        return next;
      });
    } else {
      setSessionHearts((hearts) => Math.max(0, hearts - 1));
      setSessionStreak(0);
      setMistakes((items) => [...items, { prompt: question.prompt, explanation: question.explanation }]);
    }
  };

  const finishLesson = () => {
    if (!selectedLesson) return;
    const totalQuestions = selectedLesson.questions.length || 1;
    const accuracy = correctCount / totalQuestions;
    const passed = accuracy >= 0.6 && sessionHearts > 0;
    const earnedXp = sessionXp + (passed ? selectedLesson.reward.xp : 0);
    const mastery = masteryFromAccuracy(accuracy);

    setProgress((prev) => {
      const previous = prev[selectedLesson.id] ?? {
        completed: false,
        bestScore: 0,
        mastery: 0,
        bestXp: 0,
      };

      return {
        ...prev,
        [selectedLesson.id]: {
          completed: previous.completed || passed,
          bestScore: Math.max(previous.bestScore, accuracy),
          mastery: Math.max(previous.mastery, mastery),
          bestXp: Math.max(previous.bestXp, earnedXp),
        },
      };
    });

    setResultMode(passed ? "pass" : "review");
    setView("result");
  };

  const handleContinue = () => {
    if (!selectedLesson) return;
    const isLastQuestion = currentQ >= selectedLesson.questions.length - 1;
    if (sessionHearts <= 0 || isLastQuestion) {
      finishLesson();
      return;
    }

    setCurrentQ((index) => index + 1);
    setSelectedAnswer(null);
    setHasChecked(false);
  };

  const getNextLessonId = () => {
    if (!selectedUnit || !selectedLesson) return null;
    const lessonIndex = selectedUnit.lessons.findIndex((lesson) => lesson.id === selectedLesson.id);
    const nextLesson = selectedUnit.lessons[lessonIndex + 1];
    return nextLesson?.questions.length ? nextLesson.id : null;
  };

  const renderMasteryStars = (count: number) => (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, idx) => (
        <Star
          key={idx}
          className={`w-3.5 h-3.5 ${idx < count ? "text-accent fill-accent" : "text-border"}`}
        />
      ))}
    </div>
  );

  const renderMapView = () => (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-secondary/60 to-background p-6 md:p-8 shadow-sm mb-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground font-body mb-3">
                Tao Learning Journey
              </p>
              <h2 className="font-display text-3xl md:text-4xl text-foreground mb-3">
                {COURSE.title}
              </h2>
              <p className="font-body text-sm md:text-base text-muted-foreground leading-relaxed">
                {COURSE.subtitle}。用 <span className="text-foreground font-medium">Tao</span> 的节奏，
                把《道德经》从“看懂一点”升级为“学会一点、记住一点、会用一点”。
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0 lg:min-w-[360px]">
              <div className="rounded-2xl bg-background/80 border border-border p-4">
                <p className="text-xs text-muted-foreground font-body mb-1">Total XP</p>
                <p className="font-display text-2xl text-primary">{totalXp}</p>
              </div>
              <div className="rounded-2xl bg-background/80 border border-border p-4">
                <p className="text-xs text-muted-foreground font-body mb-1">Mastered Lessons</p>
                <p className="font-display text-2xl text-accent">{masteredLessons}</p>
              </div>
              <div className="rounded-2xl bg-background/80 border border-border p-4">
                <p className="text-xs text-muted-foreground font-body mb-1">Units</p>
                <p className="font-display text-2xl text-foreground">{COURSE.units.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {COURSE.units.map((unit, idx) => {
            const unlocked = isUnitUnlocked(idx);
            const unitProgress = getUnitProgress(unit);
            return (
              <div key={unit.id}>
                <motion.button
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  onClick={() => openUnit(unit.id)}
                  className={`w-full rounded-3xl border p-5 md:p-6 text-left transition-all ${
                    unlocked
                      ? "border-border bg-background hover:border-primary/30 hover:shadow-md"
                      : "border-border/70 bg-muted/20 hover:border-border"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
                        unlocked ? "bg-primary/10" : "bg-muted"
                      }`}>
                        {unlocked ? unit.icon : <Lock className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground font-body">
                            Unidad {idx + 1}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-body ${
                            unit.status === "available"
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary text-muted-foreground"
                          }`}>
                            {unit.status === "available" ? "Playable now" : "Preview design"}
                          </span>
                        </div>
                        <h3 className="font-display text-2xl text-foreground mt-1">{unit.title}</h3>
                        <p className="font-body text-sm text-muted-foreground">{unit.subtitle}</p>
                        <p className="font-body text-sm text-foreground/80 mt-3 leading-relaxed max-w-2xl">
                          {unit.description}
                        </p>
                        <p className="font-chinese text-xs text-muted-foreground mt-2">{unit.cover}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap lg:justify-end">
                      <div className="rounded-2xl bg-secondary/50 px-4 py-3 min-w-[120px]">
                        <p className="text-xs text-muted-foreground font-body">Lessons</p>
                        <p className="font-display text-xl text-foreground">{unit.lessons.length}</p>
                      </div>
                      <div className="rounded-2xl bg-secondary/50 px-4 py-3 min-w-[120px]">
                        <p className="text-xs text-muted-foreground font-body">Completed</p>
                        <p className="font-display text-xl text-foreground">
                          {unitProgress.completed}/{unitProgress.total}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{unlocked ? "Open roadmap" : "Locked roadmap"}</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </motion.button>
                {idx < COURSE.units.length - 1 && (
                  <div className="flex justify-center py-2">
                    <div className="w-0.5 h-6 bg-border rounded-full" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderUnitView = () => {
    if (!selectedUnit) return null;
    const unitIndex = COURSE.units.findIndex((unit) => unit.id === selectedUnit.id);
    const unlocked = isUnitUnlocked(unitIndex);

    return (
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => setView("map")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to map
              </button>

          <div className="rounded-3xl border border-border bg-gradient-to-br from-secondary/70 to-background p-6 md:p-8 mb-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">
                    {unlocked ? selectedUnit.icon : "🔒"}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground font-body">
                      Unidad {unitIndex + 1}
                    </p>
                    <h3 className="font-display text-3xl text-foreground">{selectedUnit.title}</h3>
                    <p className="font-body text-sm text-muted-foreground">{selectedUnit.subtitle}</p>
                  </div>
                </div>
                <p className="font-body text-sm md:text-base text-foreground/85 leading-relaxed">
                  {selectedUnit.description}
                </p>
                <p className="font-chinese text-xs text-muted-foreground mt-3">{selectedUnit.cover}</p>
              </div>

              <div className="rounded-2xl bg-background/80 border border-border p-4 min-w-[220px]">
                <p className="text-xs text-muted-foreground font-body mb-2">Unit target</p>
                <div className="space-y-2 text-sm font-body text-foreground">
                  <p>1. 建立主题认知</p>
                  <p>2. 完成 5 个 lesson</p>
                  <p>3. 获得 unit mastery</p>
                </div>
              </div>
            </div>
            </div>

          <div className="space-y-4">
            {selectedUnit.lessons.map((lesson, idx) => {
              const unlockedLesson = unlocked && isLessonUnlocked(selectedUnit, idx);
              const lessonProgress = progress[lesson.id];
              return (
              <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`rounded-3xl border p-5 ${
                    unlockedLesson
                      ? "border-border bg-background"
                      : "border-border/70 bg-muted/20"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
                        unlockedLesson ? "bg-secondary" : "bg-muted"
                      }`}>
                        {unlockedLesson ? lesson.icon : <Lock className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-body">
                            {lesson.checkpoint ? "Checkpoint" : `Lesson ${idx + 1}`}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-body ${
                            lesson.checkpoint ? "bg-accent/15 text-accent-foreground" : "bg-secondary text-muted-foreground"
                          }`}>
                            {lesson.difficulty}
                          </span>
                        </div>
                        <h4 className="font-display text-xl text-foreground mt-1">{lesson.title}</h4>
                        <p className="font-body text-sm text-muted-foreground">{lesson.subtitle}</p>
                        <div className="flex gap-2 flex-wrap mt-3">
                          {lesson.skills.map((skill) => (
                            <span
                              key={skill}
                              className="px-2.5 py-1 rounded-full bg-secondary/70 text-xs text-secondary-foreground font-body"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
            </div>

                    <div className="flex items-center gap-4 flex-wrap lg:justify-end">
                      <div className="text-sm font-body text-muted-foreground">
                        <p>{lesson.duration}</p>
                        <p>+{lesson.reward.xp} XP</p>
                      </div>
                      <div>{renderMasteryStars(lessonProgress?.mastery ?? 0)}</div>
                      <button
                        onClick={() => unlockedLesson && lesson.questions.length > 0 && openLesson(lesson.id)}
                        disabled={!unlockedLesson || lesson.questions.length === 0}
                        className={`px-4 py-2 rounded-xl text-sm font-body transition-colors ${
                          unlockedLesson && lesson.questions.length > 0
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-secondary text-muted-foreground cursor-not-allowed"
                        }`}
                      >
                        {lesson.questions.length > 0 ? "Start lesson" : "Coming soon"}
                      </button>
                    </div>
                  </div>
                </motion.div>
                    );
                  })}
          </div>
        </div>
      </div>
    );
  };

  const renderLessonStartView = () => {
    if (!selectedLesson) return null;

    return (
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setView("unit")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to unit
          </button>

          <div className="rounded-3xl border border-border bg-gradient-to-br from-secondary/70 to-background p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">
                    {selectedLesson.icon}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground font-body">
                      {selectedLesson.checkpoint ? "Unit Checkpoint" : "Lesson briefing"}
                    </p>
                    <h3 className="font-display text-3xl text-foreground">{selectedLesson.title}</h3>
                    <p className="font-body text-sm text-muted-foreground">{selectedLesson.subtitle}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                  <div className="rounded-2xl bg-background/80 border border-border p-4">
                    <p className="text-xs text-muted-foreground font-body mb-1">Duration</p>
                    <p className="font-display text-xl text-foreground">{selectedLesson.duration}</p>
                  </div>
                  <div className="rounded-2xl bg-background/80 border border-border p-4">
                    <p className="text-xs text-muted-foreground font-body mb-1">Questions</p>
                    <p className="font-display text-xl text-foreground">{selectedLesson.questions.length}</p>
                  </div>
                  <div className="rounded-2xl bg-background/80 border border-border p-4">
                    <p className="text-xs text-muted-foreground font-body mb-1">Reward</p>
                    <p className="font-display text-xl text-accent">+{selectedLesson.reward.xp} XP</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-body mb-2">
                      Skills you will train
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedLesson.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-body"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-background/70 p-4">
                    <p className="text-sm font-body text-foreground">
                      完成本节后，你会获得 <span className="font-medium text-primary">{selectedLesson.reward.badge}</span>，
                      并为本单元的 mastery 累积星级。
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-background/80 p-5 min-w-[280px]">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-body mb-3">
                  Session preview
                </p>
                <div className="space-y-3 text-sm font-body">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Hearts</span>
                    <span className="text-foreground font-medium">5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Base XP</span>
                    <span className="text-foreground font-medium">{selectedLesson.reward.xp}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Mode</span>
                    <span className="text-foreground font-medium">novato</span>
                  </div>
                </div>

                <button
                  onClick={startLessonSession}
                  className="mt-6 w-full py-3 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-body"
                >
                  Start lesson
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderQuizView = () => {
    if (!selectedLesson) return null;
    const question = selectedLesson.questions[currentQ];
    const progressPct = ((currentQ + (hasChecked ? 1 : 0)) / selectedLesson.questions.length) * 100;
    const isCorrect = selectedAnswer === question.correctIndex;

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 md:px-8 py-5 border-b border-border">
          <div className="max-w-5xl mx-auto flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => setView("lessonStart")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground">
                  <Heart className="w-4 h-4 text-destructive" /> {sessionHearts}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground">
                  <Sparkles className="w-4 h-4 text-accent" /> {sessionXp} XP
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground">
                  <Flame className="w-4 h-4 text-primary" /> x{Math.max(sessionStreak, 1)}
                </div>
              </div>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div className="h-full bg-primary" animate={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-3xl mx-auto">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-border bg-background p-6 md:p-8 shadow-sm"
            >
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-body">
                  {question.type}
                </span>
                <span className="px-3 py-1 rounded-full bg-secondary text-muted-foreground text-xs font-body">
                  {currentQ + 1}/{selectedLesson.questions.length}
                </span>
              </div>

              {question.context && (
                <p className="font-body text-sm text-muted-foreground mb-2">{question.context}</p>
              )}
              {question.source && (
                <div className="rounded-2xl bg-secondary/40 p-4 mb-5">
                  <p className="text-sm font-body text-foreground leading-relaxed">{question.source}</p>
                </div>
              )}

              <h3 className="font-display text-2xl md:text-3xl text-foreground mb-6">
                {question.prompt}
              </h3>

              <div className="space-y-3">
                {question.options.map((option, index) => {
                  const isPicked = selectedAnswer === index;
                  let cls = "border-border hover:border-primary/40 hover:bg-secondary/30";
                  if (hasChecked) {
                    if (index === question.correctIndex) cls = "border-green-500 bg-green-50 text-green-800";
                    else if (isPicked) cls = "border-red-400 bg-red-50 text-red-700";
                  } else if (isPicked) {
                    cls = "border-primary bg-primary/5";
                  }

                  return (
                    <button
                      key={option}
                      onClick={() => !hasChecked && setSelectedAnswer(index)}
                      disabled={hasChecked}
                      className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${cls}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-background/80 border border-border flex items-center justify-center text-xs font-body text-muted-foreground shrink-0">
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="font-body text-sm md:text-base">{option}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {hasChecked && (
                <div
                  className={`mt-6 rounded-2xl border p-4 ${
                    isCorrect
                      ? "border-green-400 bg-green-50 text-green-800"
                      : "border-red-300 bg-red-50 text-red-700"
                  }`}
                >
                  <p className="font-body text-sm font-medium mb-1">
                    {isCorrect ? "答对了，继续保持。" : "这题错了，但你获得了一次更深理解的机会。"}
                  </p>
                  <p className="font-body text-sm leading-relaxed">{question.explanation}</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        <div className="px-6 md:px-8 py-4 border-t border-border bg-background/95 backdrop-blur-md">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground font-body">
              {hasChecked
                ? sessionHearts > 0
                  ? "看完解释后继续下一题。"
                  : "Hearts 已耗尽，本次将进入复盘结果页。"
                : "选择一个答案，然后点击 Check。"}
            </p>
            {!hasChecked ? (
              <button
                onClick={handleCheckAnswer}
                disabled={selectedAnswer === null}
                className="px-5 py-3 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-body"
              >
                Check
              </button>
            ) : (
              <button
                onClick={handleContinue}
                className="px-5 py-3 rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90 transition-colors text-sm font-body"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderResultView = () => {
    if (!selectedLesson) return null;
    const accuracy = selectedLesson.questions.length
      ? Math.round((correctCount / selectedLesson.questions.length) * 100)
      : 0;
    const mastery = masteryFromAccuracy(correctCount / (selectedLesson.questions.length || 1));
    const nextLessonId = getNextLessonId();

    return (
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl border border-border bg-gradient-to-br from-secondary/70 to-background p-6 md:p-8">
            <div className="text-center mb-8">
              <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                resultMode === "pass" ? "bg-accent/20" : "bg-secondary"
              }`}>
                {resultMode === "pass" ? (
                  <Trophy className="w-9 h-9 text-accent" />
                ) : (
                  <BookOpen className="w-9 h-9 text-primary" />
                )}
              </div>
              <h3 className="font-display text-3xl text-foreground mb-2">
                {resultMode === "pass" ? "Lesson cleared" : "Review and come back stronger"}
              </h3>
              <p className="font-body text-sm text-muted-foreground">{selectedLesson.title}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
              <div className="rounded-2xl bg-background/85 border border-border p-4 text-center">
                <p className="text-xs text-muted-foreground font-body mb-1">Accuracy</p>
                <p className="font-display text-2xl text-foreground">{accuracy}%</p>
              </div>
              <div className="rounded-2xl bg-background/85 border border-border p-4 text-center">
                <p className="text-xs text-muted-foreground font-body mb-1">Correct</p>
                <p className="font-display text-2xl text-foreground">{correctCount}</p>
              </div>
              <div className="rounded-2xl bg-background/85 border border-border p-4 text-center">
                <p className="text-xs text-muted-foreground font-body mb-1">Earned XP</p>
                <p className="font-display text-2xl text-accent">
                  {sessionXp + (resultMode === "pass" ? selectedLesson.reward.xp : 0)}
                </p>
              </div>
              <div className="rounded-2xl bg-background/85 border border-border p-4 text-center">
                <p className="text-xs text-muted-foreground font-body mb-1">Best streak</p>
                <p className="font-display text-2xl text-primary">x{Math.max(bestStreak, 1)}</p>
              </div>
            </div>

            <div className="flex items-center justify-center mb-6">{renderMasteryStars(mastery)}</div>

            {mistakes.length > 0 && (
              <div className="rounded-2xl border border-border bg-background/80 p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <ScrollText className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">Review mistakes</p>
                </div>
                <div className="space-y-3">
                  {mistakes.map((item, idx) => (
                    <div key={`${item.prompt}-${idx}`} className="rounded-2xl bg-secondary/50 p-4">
                      <p className="font-body text-sm text-foreground mb-1">{item.prompt}</p>
                      <p className="font-body text-xs text-muted-foreground leading-relaxed">
                        {item.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={startLessonSession}
                className="px-5 py-3 rounded-2xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-sm font-body"
              >
                Retry lesson
              </button>
              {resultMode === "pass" && nextLessonId ? (
                <button
                  onClick={() => {
                    setSelectedLessonId(nextLessonId);
                    setView("lessonStart");
                  }}
                  className="px-5 py-3 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-body"
                >
                  Next lesson
                </button>
              ) : (
                <button
                  onClick={() => setView("unit")}
                  className="px-5 py-3 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-body"
                >
                  Return to unit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/90 backdrop-blur-md">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">El Camino del Tao</h2>
              <p className="font-chinese text-xs text-muted-foreground">
                闯关修道 · Itinerario del Tao
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {view === "map" && renderMapView()}
          {view === "unit" && renderUnitView()}
          {view === "lessonStart" && renderLessonStartView()}
          {view === "quiz" && renderQuizView()}
          {view === "result" && renderResultView()}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ElCaminoDelTao;
