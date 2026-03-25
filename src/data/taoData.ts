export interface Chapter {
  number: number;
  chinese: string;
  translations: Record<string, string>;
  aiInterpretation: string;
}

export interface WordAlignment {
  spanish: string;
  chinese: string;
  pinyin: string;
  meaning: string;
  syntacticRole: string;
  syntacticRoleChinese: string;
}

export const translators = [
  { id: "carmelo", name: "Carmelo Elorduy", year: 1977 },
  { id: "preciado", name: "Iñaki Preciado", year: 2006 },
  { id: "suarez", name: "Anne-Hélène Suárez", year: 1998 },
  { id: "garcia", name: "J.A. García Noblejas", year: 2012 },
  { id: "botton", name: "Flora Botton-Burlá", year: 1983 },
];

export const chapters: Chapter[] = [
  {
    number: 1,
    chinese: "道可道，非常道。名可名，非常名。无名天地之始；有名万物之母。故常无，欲以观其妙；常有，欲以观其徼。此两者，同出而异名，同谓之玄。玄之又玄，众妙之门。",
    translations: {
      carmelo: "El Camino que puede recorrerse no es el Camino Eterno. El nombre que puede nombrarse no es el Nombre Eterno. Lo Sin-nombre es el origen del Cielo y la Tierra. Lo Nombrado es la madre de todas las cosas. Así, libre de deseos, se contempla su misterio; cargado de deseos, se contemplan sus manifestaciones. Ambos brotan de la misma fuente pero difieren en nombre. Su identidad es el misterio. Misterio de misterios, puerta de todas las maravillas.",
      preciado: "El Tao que puede expresarse no es el Tao permanente. El nombre que puede pronunciarse no es el nombre permanente. Lo que no tiene nombre es principio del cielo y de la tierra. Lo que tiene nombre es madre de los diez mil seres. Por eso, desde el no-ser contemplamos su esencia; desde el ser contemplamos sus confines. Ambos tienen el mismo origen aunque distinto nombre. Su identidad es el misterio, misterio de misterios, puerta de toda maravilla.",
      suarez: "El camino que se puede recorrer no es el camino permanente. El nombre que se puede nombrar no es el nombre permanente. Sin nombre es el principio del cielo y la tierra. Con nombre es la madre de las diez mil cosas. Libre siempre de deseo, se contempla su misterio. Siempre presa del deseo, se contemplan solo sus efectos. Los dos brotan de la misma fuente pero tienen nombres distintos. Juntos se llaman oscuridad. Oscuridad sobre oscuridad, la puerta de todo misterio.",
      garcia: "La vía que puede ser pronunciada no es la vía constante. El nombre que puede ser expresado no es el nombre constante. Sin nombre es el comienzo del cielo y la tierra. Con nombre es la madre de la miríada de seres. Por eso, permanentemente sin deseo, se observa su sutileza; permanentemente con deseo, se observan sus contornos. Estos dos salen juntos pero se nombran diferente. Juntos se les dice oscuridad, oscuridad sobre oscuridad, la puerta de todas las sutilezas.",
      botton: "El Dao que puede ser expresado no es el Dao eterno. El nombre que puede ser nombrado no es el nombre eterno. Lo sin nombre es origen del cielo y la tierra. Lo nombrado es madre de las diez mil cosas. Libre de deseos puedes ver el misterio. Lleno de deseos solo ves las manifestaciones. Ambos surgen de la misma fuente pero difieren en nombre; ambos pueden llamarse oscuros. Oscuridad dentro de oscuridad, la puerta a todo misterio.",
    },
    aiInterpretation: "El primer capítulo establece la paradoja fundamental del Tao Te Ching: el Dao verdadero trasciende toda descripción lingüística. Esta tensión entre lo nombrable y lo innombrable refleja la dialéctica entre 有 (yǒu, ser) y 无 (wú, no-ser), conceptos que las traducciones españolas manejan de formas reveladoras — desde el 'Camino Eterno' de Elorduy hasta el 'Tao permanente' de Preciado.",
  },
  {
    number: 2,
    chinese: "天下皆知美之为美，斯恶已。皆知善之为善，斯不善已。故有无相生，难易相成，长短相形，高下相倾，音声相和，前后相随。是以圣人处无为之事，行不言之教。万物作焉而不辞，生而不有，为而不恃，功成而弗居。夫唯弗居，是以不去。",
    translations: {
      carmelo: "Cuando el mundo entero reconoce lo bello como bello, ya existe la fealdad. Cuando todos reconocen lo bueno como bueno, ya existe el mal. Ser y no-ser se engendran mutuamente. Lo difícil y lo fácil se complementan. Lo largo y lo corto se definen recíprocamente. Lo alto y lo bajo se inclinan uno hacia otro. La voz y el sonido se armonizan entre sí. El antes y el después se suceden mutuamente. Por eso el sabio actúa sin actuar, enseña sin hablar.",
      preciado: "Cuando en el mundo todos reconocen lo bello como bello, ya existe la fealdad. Cuando todos reconocen lo bueno como bueno, ya existe lo que no es bueno. Porque el ser y el no-ser se generan mutuamente, lo difícil y lo fácil se completan, lo largo y lo corto se forman entre sí, lo alto y lo bajo se inclinan, voz y sonido se armonizan, delante y detrás se siguen. Por esto el sabio se sitúa en la acción sin acción, practica la enseñanza sin palabras.",
      suarez: "Cuando todo el mundo reconoce lo bello como bello, esto en sí mismo es fealdad. Cuando todo el mundo reconoce el bien como bien, esto en sí mismo es mal. Ciertamente, ser y no-ser se engendran uno al otro. Difícil y fácil se complementan entre sí. Largo y corto se forman mutuamente. Alto y bajo se llenan uno al otro. Tono y voz se armonizan entre sí. Antes y después se siguen mutuamente. Por eso, el sabio actúa sin actuar y enseña sin hablar.",
      garcia: "Cuando bajo el cielo todos saben que lo bello es bello, existe ya lo feo. Cuando todos saben que el bien es bien, existe ya el mal. Así, ser y no-ser se producen mutuamente, difícil y fácil se completan, largo y corto se forman, alto y bajo se colman, sonido y voz se armonizan, anterior y posterior se siguen. Por esto el hombre sabio se sitúa en los asuntos del no actuar, practica la enseñanza del no hablar.",
      botton: "Cuando todos en el mundo reconocen lo bello como bello, lo feo queda establecido. Cuando todos reconocen lo bueno como bueno, lo malo queda establecido. Ser y no-ser se producen mutuamente. Difícil y fácil se complementan. Largo y corto se contrastan. Alto y bajo se apoyan. Tono y voz se armonizan. Antes y después se siguen. El sabio realiza sin actuar, enseña sin palabras.",
    },
    aiInterpretation: "El segundo capítulo introduce la doctrina de los opuestos complementarios y el concepto de 无为 (wú wéi, no-acción). Las traducciones revelan matices importantes: 'actúa sin actuar' vs 'se sitúa en la acción sin acción' — cada traductor negocia de forma diferente la paradoja del wu wei para el lector hispanohablante.",
  },
  {
    number: 3,
    chinese: "不尚贤，使民不争；不贵难得之货，使民不为盗；不见可欲，使民心不乱。是以圣人之治：虚其心，实其腹，弱其志，强其骨。常使民无知无欲。使夫智者不敢为也。为无为，则无不治。",
    translations: {
      carmelo: "No exaltar a los hombres de talento evita que la gente compita. No valorar los bienes difíciles de obtener evita que la gente robe. No exhibir lo deseable evita que el corazón de la gente se turbe. Por eso el gobierno del sabio: vacía los corazones, llena los estómagos, debilita las ambiciones, fortalece los huesos. Siempre mantiene al pueblo sin conocimiento ni deseo. Hace que los astutos no se atrevan a actuar. Practica el no-hacer, y todo queda en orden.",
      preciado: "No ensalzar a los sabios para que el pueblo no compita. No apreciar los bienes difíciles de obtener para que el pueblo no robe. No mostrar lo codiciable para que el corazón del pueblo no se turbe. Por eso, el gobierno del sabio consiste en vaciar los corazones y llenar los vientres, en debilitar las voluntades y fortalecer los huesos. Mantiene siempre al pueblo sin saber ni desear y hace que los que saben no osen actuar. Practica el no actuar y todo se ordena.",
      suarez: "No exaltar a los dignos evita la rivalidad entre el pueblo. No apreciar bienes difíciles de obtener evita que el pueblo robe. No mostrar lo deseable mantiene el corazón del pueblo libre de confusión. Por eso el sabio gobierna vaciando corazones, llenando vientres, debilitando ambiciones, fortaleciendo huesos. Mantiene al pueblo sin saber y sin desear. Hace que los astutos no se atrevan a actuar. Actúa sin actuar y todo se ordena.",
      garcia: "No exaltar a los sabios, para que el pueblo no compita. No estimar los bienes difíciles de obtener, para que el pueblo no robe. No mostrar lo codiciable, para que el corazón del pueblo no se turbe. Por esto el sabio gobierna: vaciando corazones y llenando vientres, debilitando voluntades y fortaleciendo huesos. Mantiene siempre al pueblo sin saber y sin desear. Hace que los inteligentes no osen actuar. Practica el no actuar y nada queda sin gobernar.",
      botton: "No exaltar a los dignos impide que el pueblo compita. No apreciar bienes difíciles de obtener impide que el pueblo robe. No mostrar lo codiciable mantiene tranquilo el corazón del pueblo. El sabio gobierna vaciando corazones, llenando vientres, debilitando voluntades, fortaleciendo huesos. Siempre mantiene al pueblo sin conocimiento ni deseo. Logra que los astutos no actúen. Practica el no-actuar: todo se ordena por sí mismo.",
    },
    aiInterpretation: "El capítulo 3 aborda la política del wu wei aplicada al gobierno. La tensión entre 'vaciar corazones' y 'llenar vientres' crea una paradoja que cada traductor resuelve de forma diferente — algunos enfatizan la dimensión espiritual ('corazones') mientras otros la cognitiva ('mentes').",
  },
];

export const wordAlignments: Record<string, WordAlignment[]> = {
  "carmelo-1": [
    { spanish: "El", chinese: "（冠词）", pinyin: "-", meaning: "Artículo definido", syntacticRole: "Determinante", syntacticRoleChinese: "冠词" },
    { spanish: "Camino", chinese: "道", pinyin: "dào", meaning: "Vía, camino, principio", syntacticRole: "Sujeto / Núcleo nominal", syntacticRoleChinese: "名词作主语" },
    { spanish: "que", chinese: "（关系代词）", pinyin: "-", meaning: "Pronombre relativo", syntacticRole: "Nexo subordinante", syntacticRoleChinese: "关系词" },
    { spanish: "puede", chinese: "可", pinyin: "kě", meaning: "Poder, ser posible", syntacticRole: "Verbo modal", syntacticRoleChinese: "能愿动词" },
    { spanish: "recorrerse", chinese: "道", pinyin: "dào", meaning: "Recorrer (uso verbal)", syntacticRole: "Verbo principal", syntacticRoleChinese: "动词作谓语" },
    { spanish: "no", chinese: "非", pinyin: "fēi", meaning: "No, negación", syntacticRole: "Adverbio de negación", syntacticRoleChinese: "否定副词" },
    { spanish: "es", chinese: "（系词）", pinyin: "-", meaning: "Ser", syntacticRole: "Verbo copulativo", syntacticRoleChinese: "系动词" },
    { spanish: "el", chinese: "（冠词）", pinyin: "-", meaning: "Artículo definido", syntacticRole: "Determinante", syntacticRoleChinese: "冠词" },
    { spanish: "Camino", chinese: "道", pinyin: "dào", meaning: "Vía, camino, principio", syntacticRole: "Atributo nominal", syntacticRoleChinese: "名词作表语" },
    { spanish: "Eterno", chinese: "常", pinyin: "cháng", meaning: "Constante, eterno, permanente", syntacticRole: "Adjetivo calificativo", syntacticRoleChinese: "形容词作定语" },
    { spanish: "nombre", chinese: "名", pinyin: "míng", meaning: "Nombre, denominar", syntacticRole: "Sujeto / Núcleo nominal", syntacticRoleChinese: "名词作主语" },
    { spanish: "nombrarse", chinese: "名", pinyin: "míng", meaning: "Nombrar (uso verbal)", syntacticRole: "Verbo principal", syntacticRoleChinese: "动词作谓语" },
    { spanish: "Nombre", chinese: "名", pinyin: "míng", meaning: "Nombre", syntacticRole: "Atributo nominal", syntacticRoleChinese: "名词作表语" },
    { spanish: "Sin-nombre", chinese: "无名", pinyin: "wú míng", meaning: "Sin nombre, lo innominado", syntacticRole: "Sujeto compuesto", syntacticRoleChinese: "偏正短语作主语" },
    { spanish: "origen", chinese: "始", pinyin: "shǐ", meaning: "Inicio, origen, comienzo", syntacticRole: "Predicado nominal", syntacticRoleChinese: "名词作谓语" },
    { spanish: "Cielo", chinese: "天", pinyin: "tiān", meaning: "Cielo", syntacticRole: "Complemento nominal", syntacticRoleChinese: "名词作定语" },
    { spanish: "Tierra", chinese: "地", pinyin: "dì", meaning: "Tierra", syntacticRole: "Complemento nominal", syntacticRoleChinese: "名词作定语" },
    { spanish: "Nombrado", chinese: "有名", pinyin: "yǒu míng", meaning: "Lo que tiene nombre", syntacticRole: "Sujeto compuesto", syntacticRoleChinese: "偏正短语作主语" },
    { spanish: "madre", chinese: "母", pinyin: "mǔ", meaning: "Madre, origen materno", syntacticRole: "Predicado nominal", syntacticRoleChinese: "名词作谓语" },
    { spanish: "cosas", chinese: "物", pinyin: "wù", meaning: "Cosas, seres", syntacticRole: "Complemento nominal", syntacticRoleChinese: "名词作宾语" },
    { spanish: "misterio", chinese: "妙", pinyin: "miào", meaning: "Misterio, maravilla, sutileza", syntacticRole: "Objeto directo", syntacticRoleChinese: "名词作宾语" },
    { spanish: "manifestaciones", chinese: "徼", pinyin: "jiào", meaning: "Contornos, manifestaciones", syntacticRole: "Objeto directo", syntacticRoleChinese: "名词作宾语" },
    { spanish: "fuente", chinese: "同出", pinyin: "tóng chū", meaning: "Mismo origen, brotar juntos", syntacticRole: "Predicado verbal", syntacticRoleChinese: "动词短语" },
    { spanish: "misterio", chinese: "玄", pinyin: "xuán", meaning: "Oscuro, misterioso, profundo", syntacticRole: "Predicado nominal", syntacticRoleChinese: "形容词作表语" },
    { spanish: "maravillas", chinese: "妙", pinyin: "miào", meaning: "Maravillas, prodigios", syntacticRole: "Complemento nominal", syntacticRoleChinese: "名词作定语" },
    { spanish: "puerta", chinese: "门", pinyin: "mén", meaning: "Puerta, portal", syntacticRole: "Predicado nominal", syntacticRoleChinese: "名词作谓语" },
  ],
};

export const graphNodes = [
  { id: "dao", label: "道 (Dào)", x: 300, y: 150, type: "concept" as const },
  { id: "camino", label: "El Camino", x: 150, y: 300, type: "translation" as const },
  { id: "via", label: "La Vía", x: 450, y: 300, type: "translation" as const },
  { id: "tao", label: "El Tao", x: 300, y: 350, type: "translation" as const },
  { id: "wuwei", label: "无为 (Wú Wéi)", x: 550, y: 150, type: "concept" as const },
  { id: "noaction", label: "No-acción", x: 650, y: 300, type: "translation" as const },
  { id: "sinactuar", label: "Sin actuar", x: 500, y: 400, type: "translation" as const },
  { id: "de", label: "德 (Dé)", x: 100, y: 150, type: "concept" as const },
  { id: "virtud", label: "La Virtud", x: 50, y: 300, type: "translation" as const },
  { id: "carmelo_t", label: "Elorduy", x: 200, y: 450, type: "translator" as const },
  { id: "preciado_t", label: "Preciado", x: 400, y: 450, type: "translator" as const },
];

export const graphEdges = [
  { from: "dao", to: "camino", label: "Domesticación" },
  { from: "dao", to: "via", label: "Domesticación" },
  { from: "dao", to: "tao", label: "Extranjerización" },
  { from: "wuwei", to: "noaction", label: "Calco semántico" },
  { from: "wuwei", to: "sinactuar", label: "Perífrasis" },
  { from: "de", to: "virtud", label: "Domesticación" },
  { from: "carmelo_t", to: "camino", label: "Traduce como" },
  { from: "carmelo_t", to: "noaction", label: "Traduce como" },
  { from: "preciado_t", to: "tao", label: "Traduce como" },
  { from: "preciado_t", to: "sinactuar", label: "Traduce como" },
];

export const mbtiData = {
  type: "INFJ",
  label: "El Consejero",
  wuWeiAlignment: 82,
  dimensions: [
    { axis: "Intuición (N)", value: 88 },
    { axis: "Sentimiento (F)", value: 75 },
    { axis: "Introversión (I)", value: 92 },
    { axis: "Juicio (J)", value: 68 },
    { axis: "Wu Wei (无为)", value: 82 },
    { axis: "Vacuidad (空)", value: 71 },
    { axis: "Armonía (和)", value: 89 },
    { axis: "Naturalidad (自然)", value: 76 },
  ],
};

export const chatPersonas = {
  laozi: {
    name: "老子 · Laozi",
    avatar: "🏔️",
    description: "Philosophical perspective",
    greeting: "El Dao que puede ser nombrado... Pregúntame sobre el misterio que subyace a las palabras.",
  },
  translator: {
    name: "Traductor · Lingüista",
    avatar: "📜",
    description: "Linguistic & syntactic analysis",
    greeting: "Analicemos las estrategias de traducción. ¿Qué versión te gustaría comparar?",
  },
  student: {
    name: "Compañero · Estudiante",
    avatar: "💬",
    description: "Casual discussion",
    greeting: "¡Hola! ¿Qué parte del Tao Te Ching estás estudiando? Podemos explorarlo juntos.",
  },
};
