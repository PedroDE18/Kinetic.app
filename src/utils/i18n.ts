/**
 * EUNOIA i18n — Internationalization Engine
 * Zero cost, local-first, type-safe English & Brazilian Portuguese translation system.
 */

export type SupportedLanguage = 'en' | 'pt-BR';

export interface TranslationDictionary {
  common: {
    today: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    close: string;
    add: string;
    done: string;
    pending: string;
    all: string;
    search: string;
    streak: string;
    days: string;
    settings: string;
    profile: string;
    language: string;
    theme: string;
    light: string;
    dark: string;
    cloudSync: string;
    localFirst: string;
    brandTagline: string;
  };
  nav: {
    progress: string;
    systems: string;
    today: string;
    body: string;
    mind: string;
  };
  today: {
    goodMorning: string;
    goodAfternoon: string;
    goodEvening: string;
    friend: string;
    dailyIntention: string;
    dailyIntentionPrompt: string;
    refine: string;
    setIntention: string;
    disciplines: string;
    priorityTasks: string;
    trainingPlan: string;
    restDay: string;
    trainingDay: string;
    startWorkout: string;
    activeWorkoutInProgress: string;
    quickLogPlaceholder: string;
    flourishSignals: {
      mind: string;
      sleep: string;
      habits: string;
      nutrition: string;
    };
  };
  body: {
    title: string;
    subtitle: string;
    nutrition: string;
    training: string;
    recovery: string;
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
    intake: string;
    target: string;
    breakfast: string;
    lunch: string;
    dinner: string;
    snack: string;
    addFood: string;
    logSleep: string;
    water: string;
    sleepHours: string;
    restfulness: string;
  };
  mind: {
    title: string;
    subtitle: string;
    rituals: string;
    intellect: string;
    philia: string;
    advisor: string;
    contemplativeGrounding: string;
    morningIntention: string;
    morningSubtitle: string;
    writeMorning: string;
    eveningAudit: string;
    eveningSubtitle: string;
    completeEvening: string;
    freeformEntry: string;
    archive: string;
    archiveEmpty: string;
    worksInStudy: string;
    recordWork: string;
    meaningfulConnections: string;
    addPerson: string;
    socraticCounsel: string;
    diagnosticFocus: string;
    nextLever: string;
  };
  systems: {
    title: string;
    subtitle: string;
    habits: string;
    frictionEngine: string;
    organization: string;
    activeHabits: string;
    addHabit: string;
    frictionTip: string;
    tasks: string;
  };
  progress: {
    title: string;
    subtitle: string;
    physical: string;
    contemplative: string;
    systems: string;
    weightTdee: string;
    strength: string;
    cardio: string;
    adaptiveExpenditure: string;
    reviewTarget: string;
    bodyWeightTrend: string;
    recordWeighIn: string;
    strengthVolume: string;
    cardioPerformance: string;
    contemplativeCadence: string;
    habitExecution: string;
  };
  food: {
    searchPlaceholder: string;
    estimateWithAi: string;
    offlineEstimate: string;
    barcodeScan: string;
    recentFoods: string;
    favorites: string;
    brazilianStaples: string;
  };
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    common: {
      today: 'Today',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      add: 'Add',
      done: 'Done',
      pending: 'Pending',
      all: 'All',
      search: 'Search',
      streak: 'streak',
      days: 'days',
      settings: 'Settings',
      profile: 'Life Profile',
      language: 'Language',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      cloudSync: 'Cloud Sync',
      localFirst: 'Local-First',
      brandTagline: 'A personal system for living well',
    },
    nav: {
      progress: 'progress',
      systems: 'systems',
      today: 'today',
      body: 'body',
      mind: 'mind',
    },
    today: {
      goodMorning: 'Good morning',
      goodAfternoon: 'Good afternoon',
      goodEvening: 'Good evening',
      friend: 'Friend',
      dailyIntention: 'Daily Deliberate Intention',
      dailyIntentionPrompt: 'What will you choose to focus on today? (e.g. Unhurried presence, disciplined focus)',
      refine: 'Refine',
      setIntention: 'Set Intention',
      disciplines: "Today's Disciplines",
      priorityTasks: 'Priority Tasks',
      trainingPlan: 'Physical Training Plan',
      restDay: 'Rest & Recovery Day',
      trainingDay: 'Scheduled Session',
      startWorkout: 'Start Workout',
      activeWorkoutInProgress: 'Workout in Progress',
      quickLogPlaceholder: 'Quick-log: "500ml water", "75kg weigh-in", "5km run 25min", "2 eggs & toast"...',
      flourishSignals: {
        mind: 'Mind',
        sleep: 'Sleep',
        habits: 'Habits',
        nutrition: 'Nutrition',
      },
    },
    body: {
      title: 'body.',
      subtitle: 'the physical vessel — nourishment, athletic training & restorative sleep.',
      nutrition: 'Nutrition',
      training: 'Training',
      recovery: 'Recovery',
      calories: 'Calories',
      protein: 'Protein',
      carbs: 'Carbs',
      fat: 'Fat',
      intake: 'intake',
      target: 'target',
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      snack: 'Snacks',
      addFood: 'Add Food',
      logSleep: 'Log Sleep',
      water: 'Water',
      sleepHours: 'hrs sleep',
      restfulness: 'restfulness',
    },
    mind: {
      title: 'mind.',
      subtitle: 'contemplative grounding, intellectual study, deep relationships & personal wisdom.',
      rituals: 'Rituals',
      intellect: 'Intellect',
      philia: 'Philia',
      advisor: 'Advisor',
      contemplativeGrounding: 'contemplative grounding',
      morningIntention: 'Morning Intention',
      morningSubtitle: 'Control & obstacle preview',
      writeMorning: 'Write Morning Intention',
      eveningAudit: 'Evening Audit',
      eveningSubtitle: 'Honest review without guilt',
      completeEvening: 'Complete Evening Audit',
      freeformEntry: 'Freeform entry',
      archive: 'Reflections Archive',
      archiveEmpty: 'Your reflective entries will appear here. Begin with a morning reflection to set deliberate focus.',
      worksInStudy: 'Works Currently in Study',
      recordWork: 'Record Work',
      meaningfulConnections: 'Meaningful Connections',
      addPerson: 'Add Person',
      socraticCounsel: 'Socratic Systems Counsel',
      diagnosticFocus: 'Current Diagnostic Focus',
      nextLever: 'The Single Next Lever',
    },
    systems: {
      title: 'systems.',
      subtitle: 'habits, behavioral friction engineering & daily operational architecture.',
      habits: 'Habits',
      frictionEngine: 'Friction Engine',
      organization: 'Organization',
      activeHabits: 'Active Habits',
      addHabit: 'Create Habit',
      frictionTip: 'Environment Design',
      tasks: 'Tasks',
    },
    progress: {
      title: 'progress.',
      subtitle: 'trajectory, somatic evolution & systemic consistency.',
      physical: 'Physical',
      contemplative: 'Contemplative',
      systems: 'Systems',
      weightTdee: 'Weight & TDEE',
      strength: 'Strength',
      cardio: 'Cardio',
      adaptiveExpenditure: 'Adaptive Expenditure',
      reviewTarget: 'Review Proposed Calorie Target',
      bodyWeightTrend: 'Body weight & trend',
      recordWeighIn: 'Record Weigh-in',
      strengthVolume: 'Strength Volume Progression',
      cardioPerformance: 'Cardio Performance PRs',
      contemplativeCadence: 'Contemplative Cadence',
      habitExecution: 'Habit Systems Execution',
    },
    food: {
      searchPlaceholder: 'Search foods or Brazilian staples (arroz, feijão, tapioca, pão de queijo)...',
      estimateWithAi: 'Estimate Meal with Gemini AI',
      offlineEstimate: 'Estimate Offline (Zero Cost)',
      barcodeScan: 'Scan Barcode',
      recentFoods: 'Recent Foods',
      favorites: 'Favorites',
      brazilianStaples: 'Brazilian Staples (TACO)',
    },
  },

  'pt-BR': {
    common: {
      today: 'Hoje',
      save: 'Salvar',
      cancel: 'Cancelar',
      delete: 'Excluir',
      edit: 'Editar',
      close: 'Fechar',
      add: 'Adicionar',
      done: 'Concluído',
      pending: 'Pendente',
      all: 'Todos',
      search: 'Buscar',
      streak: 'dias seguidos',
      days: 'dias',
      settings: 'Configurações',
      profile: 'Perfil de Vida',
      language: 'Idioma',
      theme: 'Tema',
      light: 'Claro',
      dark: 'Escuro',
      cloudSync: 'Nuvem Ativa',
      localFirst: 'Local Primeiro',
      brandTagline: 'Um sistema pessoal para viver bem',
    },
    nav: {
      progress: 'progresso',
      systems: 'sistemas',
      today: 'hoje',
      body: 'corpo',
      mind: 'mente',
    },
    today: {
      goodMorning: 'Bom dia',
      goodAfternoon: 'Boa tarde',
      goodEvening: 'Boa noite',
      friend: 'Amigo',
      dailyIntention: 'Intenção Deliberada Diária',
      dailyIntentionPrompt: 'Em que você escolhe focar hoje? (ex: Presença sem pressa, disciplina serena)',
      refine: 'Refinar',
      setIntention: 'Definir Intenção',
      disciplines: 'Disciplinas de Hoje',
      priorityTasks: 'Tarefas Prioritárias',
      trainingPlan: 'Plano de Treino Físico',
      restDay: 'Dia de Descanso e Recuperação',
      trainingDay: 'Sessão Programada',
      startWorkout: 'Iniciar Treino',
      activeWorkoutInProgress: 'Treino em Andamento',
      quickLogPlaceholder: 'Registro rápido: "500ml de água", "peso 74,5kg", "corrida 5km 25min", "arroz com feijão e frango"...',
      flourishSignals: {
        mind: 'Mente',
        sleep: 'Sono',
        habits: 'Hábitos',
        nutrition: 'Nutrição',
      },
    },
    body: {
      title: 'corpo.',
      subtitle: 'o templo físico — nutrição, treino atlético e sono reparador.',
      nutrition: 'Nutrição',
      training: 'Treino',
      recovery: 'Recuperação',
      calories: 'Calorias',
      protein: 'Proteínas',
      carbs: 'Carboidratos',
      fat: 'Gorduras',
      intake: 'consumo',
      target: 'meta',
      breakfast: 'Café da Manhã',
      lunch: 'Almoço',
      dinner: 'Jantar',
      snack: 'Lanches',
      addFood: 'Adicionar Alimento',
      logSleep: 'Registrar Sono',
      water: 'Água',
      sleepHours: 'h de sono',
      restfulness: 'qualidade',
    },
    mind: {
      title: 'mente.',
      subtitle: 'aterramento contemplativo, estudo intelectual, laços profundos e sabedoria pessoal.',
      rituals: 'Rituais',
      intellect: 'Intelecto',
      philia: 'Filia',
      advisor: 'Conselheiro',
      contemplativeGrounding: 'aterramento contemplativo',
      morningIntention: 'Intenção Matinal',
      morningSubtitle: 'Antecipação de obstáculos e controle',
      writeMorning: 'Escrever Intenção Matinal',
      eveningAudit: 'Auditoria Noturna',
      eveningSubtitle: 'Revisão honesta sem culpa',
      completeEvening: 'Completar Auditoria Noturna',
      freeformEntry: 'Registro livre',
      archive: 'Arquivo de Reflexões',
      archiveEmpty: 'Seus registros reflexivos aparecerão aqui. Comece com uma intenção matinal para definir foco deliberado.',
      worksInStudy: 'Obras Atualmente em Estudo',
      recordWork: 'Registrar Obra',
      meaningfulConnections: 'Conexões Significativas',
      addPerson: 'Adicionar Pessoa',
      socraticCounsel: 'Conselho Socrático de Sistemas',
      diagnosticFocus: 'Foco Diagnóstico Atual',
      nextLever: 'A Próxima Alavanca Decisiva',
    },
    systems: {
      title: 'sistemas.',
      subtitle: 'hábitos, engenharia de fricção comportamental e arquitetura operacional.',
      habits: 'Hábitos',
      frictionEngine: 'Motor de Fricção',
      organization: 'Organização',
      activeHabits: 'Hábitos Ativos',
      addHabit: 'Criar Hábito',
      frictionTip: 'Design de Ambiente',
      tasks: 'Tarefas',
    },
    progress: {
      title: 'progresso.',
      subtitle: 'trajetória, evolução física e consistência sistêmica.',
      physical: 'Físico',
      contemplative: 'Contemplativo',
      systems: 'Sistemas',
      weightTdee: 'Peso e Gasto',
      strength: 'Força',
      cardio: 'Cardio',
      adaptiveExpenditure: 'Gasto Energético Adaptativo (TDEE)',
      reviewTarget: 'Revisar Meta Calórica Proposta',
      bodyWeightTrend: 'Peso corporal e tendência',
      recordWeighIn: 'Registrar Pesagem',
      strengthVolume: 'Progressão de Volume de Força',
      cardioPerformance: 'Recordes Pessoais de Cardio',
      contemplativeCadence: 'Cadência Contemplativa',
      habitExecution: 'Execução de Hábitos',
    },
    food: {
      searchPlaceholder: 'Buscar alimentos brasileiros (arroz, feijão, tapioca, pão de queijo, picanha)...',
      estimateWithAi: 'Estimar Refeição com IA Gemini',
      offlineEstimate: 'Estimar Offline (Custo Zero)',
      barcodeScan: 'Escanear Código de Barras',
      recentFoods: 'Alimentos Recentes',
      favorites: 'Favoritos',
      brazilianStaples: 'Culinária Brasileira (TACO)',
    },
  },
};

/**
 * Resolve the user's preferred language, falling back to navigator locale.
 */
export function resolveInitialLanguage(savedPreference?: string): SupportedLanguage {
  if (savedPreference === 'pt-BR' || savedPreference === 'en') {
    return savedPreference;
  }
  if (typeof navigator !== 'undefined' && navigator.language) {
    if (navigator.language.toLowerCase().startsWith('pt')) {
      return 'pt-BR';
    }
  }
  return 'en';
}

/**
 * Hook or helper to retrieve translation bundle.
 */
export function getTranslations(lang: SupportedLanguage = 'en'): TranslationDictionary {
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}
