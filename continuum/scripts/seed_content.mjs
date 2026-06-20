// seed_content.mjs  –  run with:  node scripts/seed_content.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Read .env.local
const env = Object.fromEntries(
  readFileSync(join(__dirname, '../.env.local'), 'utf8')
    .split('\n').filter(l => l.includes('='))
    .map(l => l.split('=').map((p, i) => i === 0 ? p.trim() : l.slice(l.indexOf('=') + 1).trim()))
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// ── helpers ────────────────────────────────────────────────────
const ok  = (label, data) => console.log(`✓ ${label}:`, data?.length ?? data?.count ?? JSON.stringify(data)?.slice(0,60))
const err = (label, e)    => console.error(`✗ ${label}:`, e.message ?? e)

async function upsert(table, rows, conflict = 'id') {
  const { data, error } = await supabase.from(table).upsert(rows, { onConflict: conflict, ignoreDuplicates: true }).select('id')
  if (error) err(table, error); else ok(table, data)
  return data ?? []
}

// ── 1. TOPICS ──────────────────────────────────────────────────
const TOPICS = [
  { title: 'Алгоритми та структури даних', description: 'Сортування, пошук, дерева, графи, складність алгоритмів', icon: '🔁', slug: 'algorithms-ds' },
  { title: 'Бази даних',                   description: 'SQL, нормалізація, транзакції, індекси, NoSQL',            icon: '🗄️', slug: 'databases' },
  { title: 'Веб-розробка',                 description: 'HTML/CSS, JavaScript, HTTP, REST, фреймворки',             icon: '🌐', slug: 'web-development' },
  { title: 'Математика',                   description: 'Математичний аналіз, лінійна алгебра, дискретна математика', icon: '📐', slug: 'mathematics' },
  { title: 'Програмна інженерія',          description: 'Патерни, SOLID, тестування, CI/CD, Agile',                 icon: '⚙️', slug: 'software-engineering' },
  { title: 'ООП',                          description: 'Класи, спадковість, поліморфізм, інкапсуляція, патерни',   icon: '🧩', slug: 'oop' },
  { title: 'Операційні системи',           description: 'Процеси, потоки, памʼять, файлові системи, планування',   icon: '💻', slug: 'operating-systems' },
  { title: 'Комп\'ютерні мережі',          description: 'TCP/IP, OSI, HTTP, DNS, безпека мереж',                    icon: '🔗', slug: 'computer-networks' },
]

const { data: existingTopics } = await supabase.from('topics').upsert(
  TOPICS, { onConflict: 'slug', ignoreDuplicates: false }
).select('id, slug')

ok('topics upserted', existingTopics)

const { data: allTopics } = await supabase.from('topics').select('id, slug')
const topicId = Object.fromEntries(allTopics.map(t => [t.slug, t.id]))

// ── 2. TASKS ───────────────────────────────────────────────────
// Format: [title, description, type, difficulty, xp, explanation, [[text, is_correct], ...]]
const TASK_DEFS = [

  // ── Algorithms & DS ────────────────────────────────────────
  ['algorithms-ds', 'Яка часова складність пошуку у хеш-таблиці (середній випадок)?',
    'Оберіть правильну відповідь.', 'single_choice', 'beginner', 10,
    'У середньому хеш-таблиця знаходить елемент за O(1) завдяки прямому обчисленню адреси через хеш-функцію. У найгіршому випадку (усі елементи в одному кошику) – O(n).',
    [['O(1)', true], ['O(log n)', false], ['O(n)', false], ['O(n²)', false]]],

  ['algorithms-ds', 'Яка часова складність алгоритму сортування злиттям (Merge Sort)?',
    'Оберіть правильну відповідь для найгіршого та середнього випадків.',
    'single_choice', 'intermediate', 15,
    'Merge Sort завжди розбиває масив на дві половини рекурсивно (log n рівнів) і злиття займає O(n) на кожному рівні – разом O(n log n) для будь-якого випадку.',
    [['O(n log n)', true], ['O(n²)', false], ['O(n)', false], ['O(log n)', false]]],

  ['algorithms-ds', 'Яка часова складність бінарного пошуку в відсортованому масиві?',
    'Визначте часову складність алгоритму бінарного пошуку у відсортованому масиві з n елементів.',
    'single_choice', 'beginner', 10,
    'Бінарний пошук щоразу ділить простір пошуку навпіл. За log₂(n) кроків завжди досягає відповіді – це O(log n).',
    [['O(log n)', true], ['O(n)', false], ['O(1)', false], ['O(n log n)', false]]],

  ['algorithms-ds', 'Що таке стек (Stack)? Оберіть усі правильні твердження.',
    'Оберіть усі правильні твердження про структуру даних "стек".',
    'multiple_choice', 'beginner', 15,
    'Стек – лінійна структура LIFO. Push та Pop завжди O(1). Використовується для рекурсії, скасування дій (undo), парсингу виразів.',
    [['Принцип роботи – LIFO (Last In, First Out)', true],
     ['Push і Pop виконуються за O(1)', true],
     ['Стек підтримує довільний доступ до елементів за індексом', false],
     ['Використовується в реалізації рекурсії та undo-операцій', true],
     ['Стек завжди реалізується через масив', false]]],

  ['algorithms-ds', 'Яка складність видалення кореневого елемента з бінарної купи (Binary Heap)?',
    'Оберіть правильну відповідь.',
    'single_choice', 'intermediate', 20,
    'При видаленні кореня він замінюється останнім елементом, який потім "просівається донизу" (sift down). Максимальна кількість порівнянь – висота дерева, тобто O(log n).',
    [['O(log n)', true], ['O(n)', false], ['O(1)', false], ['O(n log n)', false]]],

  ['algorithms-ds', 'Яка різниця між DFS і BFS при обході графа?',
    'Оберіть усі коректні твердження.',
    'multiple_choice', 'intermediate', 20,
    'BFS використовує чергу і знаходить найкоротший шлях у невагових графах. DFS використовує стек (або рекурсію) і краще для пошуку циклів та топологічного сортування.',
    [['BFS знаходить найкоротший шлях у невагових графах', true],
     ['DFS використовує чергу', false],
     ['BFS використовує чергу', true],
     ['DFS краще підходить для топологічного сортування', true],
     ['BFS гарантовано знаходить найкоротший шлях у вагових графах', false]]],

  ['algorithms-ds', 'Що таке амортизована складність (amortized complexity)?',
    'Оберіть найточніше визначення.',
    'single_choice', 'advanced', 25,
    'Амортизована складність – середня вартість однієї операції в послідовності з n операцій. Наприклад, динамічний масив: більшість push O(1), але деякі O(n) для перерозподілу – амортизовано O(1).',
    [['Середня вартість однієї операції в послідовності операцій', true],
     ['Найгірша складність алгоритму', false],
     ['Складність для середньостатистичного вхідного набору', false],
     ['Складність із урахуванням кешу процесора', false]]],

  // ── Databases ─────────────────────────────────────────────
  ['databases', 'Що повертає оператор INNER JOIN?',
    'Яке твердження найточніше описує результат INNER JOIN?',
    'single_choice', 'beginner', 10,
    'INNER JOIN повертає лише ті рядки, де є відповідне значення в ОБОХ таблицях. Рядки без пари відкидаються з обох боків.',
    [['Лише рядки, що мають відповідники в обох таблицях', true],
     ['Усі рядки лівої таблиці та відповідники з правої', false],
     ['Усі рядки з обох таблиць', false],
     ['Рядки лівої таблиці без відповідників у правій', false]]],

  ['databases', 'Перша нормальна форма (1НФ) вимагає, щоб таблиця:',
    'Оберіть всі умови, яким має відповідати таблиця у 1НФ.',
    'multiple_choice', 'intermediate', 20,
    '1НФ: кожна клітинка містить атомарне (неподільне) значення, кожен стовпець має унікальне ім\'я, порядок рядків не важливий.',
    [['Усі значення атрибутів були атомарними (неподільними)', true],
     ['Не містила повторюваних груп атрибутів', true],
     ['Мала первинний ключ', false],
     ['Мала унікальне ім\'я для кожного стовпця', true],
     ['Не мала часткових залежностей від ключа', false]]],

  ['databases', 'Які властивості гарантує транзакція ACID?',
    'Оберіть усі чотири властивості ACID.',
    'multiple_choice', 'intermediate', 20,
    'ACID: Atomicity (або всі операції виконані, або жодна), Consistency (база після транзакції лишається коректною), Isolation (паралельні транзакції не бачать незавершених змін), Durability (зафіксовані зміни не втрачаються).',
    [['Atomicity (Атомарність)', true],
     ['Consistency (Узгодженість)', true],
     ['Isolation (Ізоляція)', true],
     ['Durability (Довговічність)', true],
     ['Availability (Доступність)', false]]],

  ['databases', 'Що таке індекс у базі даних?',
    'Оберіть найточніше визначення.',
    'single_choice', 'beginner', 10,
    'Індекс – допоміжна структура даних (зазвичай B-дерево або хеш), що дозволяє СУБД швидко знаходити рядки за певним стовпцем без повного сканування таблиці. Пришвидшує SELECT, уповільнює INSERT/UPDATE/DELETE.',
    [['Допоміжна структура даних для прискорення пошуку в таблиці', true],
     ['Резервна копія таблиці', false],
     ['Обмеження на унікальність значень стовпця', false],
     ['Зовнішній ключ між двома таблицями', false]]],

  ['databases', 'Яка різниця між DELETE, TRUNCATE і DROP?',
    'Оберіть правильне твердження.',
    'single_choice', 'intermediate', 20,
    'DELETE – видаляє рядки з умовою, логується, можна відкотити. TRUNCATE – швидко очищає всю таблицю, мінімально логується. DROP – видаляє саму таблицю зі структурою.',
    [['DELETE видаляє рядки з умовою і може бути відкочений; TRUNCATE очищає всю таблицю; DROP видаляє таблицю повністю', true],
     ['TRUNCATE і DELETE – синоніми, відрізняються лише швидкістю', false],
     ['DROP видаляє лише дані, але залишає структуру таблиці', false],
     ['DELETE не підтримує умову WHERE', false]]],

  ['databases', 'В якому випадку варто обрати NoSQL замість реляційної БД?',
    'Оберіть найбільш доцільний сценарій.',
    'single_choice', 'intermediate', 20,
    'NoSQL (MongoDB, Cassandra, Redis) краще для горизонтального масштабування, нефіксованої схеми та великих обсягів неструктурованих даних. Реляційна БД краща для складних JOIN-запитів і сильних гарантій ACID.',
    [['Зберігання документів зі змінною схемою та горизонтальне масштабування', true],
     ['Складні аналітичні запити з багатьма JOIN', false],
     ['Фінансові транзакції з вимогами ACID', false],
     ['Невелика кількість добре структурованих даних', false]]],

  // ── Web Development ────────────────────────────────────────
  ['web-development', 'Які HTTP-методи є ідемпотентними?',
    'Оберіть усі ідемпотентні HTTP-методи.',
    'multiple_choice', 'beginner', 15,
    'Ідемпотентний метод – той, що дає однаковий результат при повторному виклику з тими ж параметрами. GET, HEAD, PUT, DELETE – ідемпотентні. POST – не ідемпотентний (кожен виклик може створювати новий ресурс).',
    [['GET', true], ['HEAD', true], ['PUT', true], ['DELETE', true], ['POST', false]]],

  ['web-development', 'Що таке CORS і для чого він потрібен?',
    'Оберіть правильне твердження.',
    'single_choice', 'beginner', 10,
    'CORS (Cross-Origin Resource Sharing) – механізм безпеки браузера, що контролює доступ до ресурсів між різними доменами. Без CORS браузер блокує Ajax-запити до іншого origin за замовчуванням.',
    [['Механізм браузера для контролю доступу до ресурсів між різними доменами', true],
     ['Протокол шифрування HTTPS-трафіку', false],
     ['Техніка оптимізації завантаження CSS', false],
     ['Метод автентифікації користувачів', false]]],

  ['web-development', 'Яка різниця між localStorage і sessionStorage?',
    'Оберіть правильне твердження.',
    'single_choice', 'beginner', 10,
    'localStorage – постійне сховище, дані зберігаються до явного видалення. sessionStorage – очищається при закритті вкладки/браузера. Обидва зберігають до ~5 MB рядків.',
    [['localStorage зберігається постійно; sessionStorage очищається при закритті вкладки', true],
     ['sessionStorage більше за обсягом ніж localStorage', false],
     ['localStorage доступний між різними доменами', false],
     ['Обидва зберігають об\'єкти без серіалізації', false]]],

  ['web-development', 'Як працює Event Loop у JavaScript?',
    'Оберіть найточніший опис.',
    'single_choice', 'intermediate', 20,
    'JS однопотоковий. Event loop: синхронний код виконується в call stack. Після його очищення – мікрозавдання (Promise.then, queueMicrotask), потім один елемент черги макрозавдань (setTimeout, setInterval, I/O).',
    [['Event loop після очищення стека виконує мікрозавдання (Promise), потім одне макрозавдання (setTimeout)', true],
     ['setTimeout завжди виконується до Promise.then', false],
     ['JavaScript багатопотоковий і виконує завдання паралельно', false],
     ['Мікрозавдання виконуються після кожного макрозавдання', false]]],

  ['web-development', 'Що таке JWT (JSON Web Token)?',
    'Оберіть правильне визначення.',
    'single_choice', 'intermediate', 20,
    'JWT – компактний токен із трьох частин (header.payload.signature) у форматі Base64. Сервер підписує payload секретним ключем. Клієнт надсилає токен в заголовку – сервер верифікує підпис без звернення до БД.',
    [['Самодостатній підписаний токен із трьох частин (header.payload.signature), що містить claims', true],
     ['Зашифрований пароль користувача, що зберігається в cookies', false],
     ['Протокол обміну ключами між сервером і клієнтом', false],
     ['Метод стиснення JSON-відповідей API', false]]],

  ['web-development', 'Що описує аббревіатура REST?',
    'Оберіть правильне розшифрування та визначення.',
    'single_choice', 'beginner', 10,
    'REST (Representational State Transfer) – архітектурний стиль API з 6 обмеженнями: stateless, client-server, cacheable, layered system, uniform interface, code on demand.',
    [['Representational State Transfer – архітектурний стиль для stateless API', true],
     ['Remote Execution Service Technology – протокол виклику функцій', false],
     ['Reliable Encrypted Socket Transfer – протокол безпечної передачі', false],
     ['React Express Standard Template – стандарт для Node.js', false]]],

  // ── OOP ───────────────────────────────────────────────────
  ['oop', 'Що таке поліморфізм в ООП?',
    'Оберіть найточніше визначення.',
    'single_choice', 'beginner', 10,
    'Поліморфізм дозволяє викликати однаковий інтерфейс (метод) для об\'єктів різних типів. Наприклад, метод draw() по-різному поводиться для Circle, Square, Triangle.',
    [['Здатність об\'єктів різних типів відповідати на однаковий інтерфейс', true],
     ['Приховування внутрішньої реалізації класу від зовнішнього коду', false],
     ['Механізм наслідування методів від батьківського класу', false],
     ['Можливість класу мати кілька конструкторів', false]]],

  ['oop', 'Які принципи входять до SOLID?',
    'Оберіть усі 5 правильних принципів.',
    'multiple_choice', 'intermediate', 25,
    'SOLID: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.',
    [['Single Responsibility Principle', true],
     ['Open/Closed Principle', true],
     ['Liskov Substitution Principle', true],
     ['Interface Segregation Principle', true],
     ['Dependency Inversion Principle', true],
     ['Don\'t Repeat Yourself Principle', false]]],

  ['oop', 'Яка різниця між абстрактним класом та інтерфейсом?',
    'Оберіть найточніше твердження.',
    'single_choice', 'intermediate', 20,
    'Абстрактний клас може мати реалізацію методів, поля та конструктор – підходить для часткової реалізації. Інтерфейс визначає лише контракт. Клас може реалізовувати кілька інтерфейсів, але успадковуватись тільки від одного абстрактного класу (у мовах без множинного успадкування).',
    [['Абстрактний клас може містити реалізацію; клас може успадкуватись лише від одного абстрактного класу', true],
     ['Інтерфейс та абстрактний клас ідентичні за можливостями', false],
     ['Клас може реалізувати лише один інтерфейс', false],
     ['Абстрактний клас не може мати конструктора', false]]],

  ['oop', 'Що таке патерн Singleton?',
    'Оберіть правильне визначення.',
    'single_choice', 'intermediate', 20,
    'Singleton гарантує, що клас має єдиний екземпляр та надає глобальну точку доступу до нього. Корисний для пулів з\'єднань, конфігурації, логгерів. Але ускладнює тестування через глобальний стан.',
    [['Патерн, що гарантує існування лише одного екземпляра класу', true],
     ['Патерн для створення сімейств пов\'язаних об\'єктів', false],
     ['Патерн для відокремлення алгоритму від структури', false],
     ['Патерн для обгортання об\'єкта додатковою функціональністю', false]]],

  ['oop', 'Що таке патерн Observer (Спостерігач)?',
    'Оберіть найточніший опис.',
    'single_choice', 'intermediate', 20,
    'Observer: об\'єкт-Subject зберігає список спостерігачів (Observers) та сповіщає їх автоматично при зміні свого стану. Є основою для подієво-орієнтованого програмування та реактивних систем (RxJS, Vue reactivity).',
    [['Subject зберігає список Observers і сповіщає їх при зміні стану', true],
     ['Проксі-об\'єкт, що контролює доступ до іншого об\'єкта', false],
     ['Ланцюжок обробників запиту, що передають запит далі', false],
     ['Стратегія, що дозволяє замінювати алгоритми під час виконання', false]]],

  // ── Operating Systems ─────────────────────────────────────
  ['operating-systems', 'Яка різниця між процесом і потоком?',
    'Оберіть правильне твердження.',
    'single_choice', 'beginner', 10,
    'Процес – незалежна програма з власним адресним простором. Потоки всередині процесу поділяють той самий адресний простір, що робить їх легшими для створення та перемикання контексту.',
    [['Потоки поділяють адресний простір процесу; процеси мають окремі адресні простори', true],
     ['Процеси швидші за потоки через відсутність ізоляції', false],
     ['Один процес не може мати кілька потоків', false],
     ['Потоки завжди виконуються на окремих процесорах', false]]],

  ['operating-systems', 'Що таке deadlock і які умови його виникнення?',
    'Оберіть усі умови (умови Coffman), що необхідні для виникнення deadlock.',
    'multiple_choice', 'intermediate', 25,
    'Deadlock виникає, якщо одночасно виконуються 4 умови Coffman: Mutual Exclusion (ресурс не ділиться), Hold and Wait (тримає і чекає), No Preemption (не можна відібрати), Circular Wait (кільцеве очікування).',
    [['Mutual Exclusion – ресурс використовується лише одним процесом одночасно', true],
     ['Hold and Wait – процес тримає ресурс і чекає інших', true],
     ['No Preemption – ресурс не можна забрати примусово', true],
     ['Circular Wait – кільцеве очікування ресурсів', true],
     ['Priority Inversion – процес з низьким пріоритетом блокує процес з високим', false]]],

  ['operating-systems', 'Що таке сторінкова пам\'ять (Paging)?',
    'Оберіть правильне визначення.',
    'single_choice', 'intermediate', 20,
    'Paging ділить фізичну пам\'ять на фреймі фіксованого розміру, а віртуальний адресний простір – на сторінки того ж розміру. Таблиця сторінок відображає сторінки на фрейми. Це усуває зовнішню фрагментацію.',
    [['Розбивка пам\'яті на фіксовані блоки (сторінки/фрейми) для відображення між віртуальним та фізичним адресами', true],
     ['Техніка стиснення даних у пам\'яті для звільнення місця', false],
     ['Механізм кешування дискових блоків у RAM', false],
     ['Алгоритм вивантаження сторінок на диск при нестачі RAM', false]]],

  // ── Computer Networks ─────────────────────────────────────
  ['computer-networks', 'Яка різниця між TCP і UDP?',
    'Оберіть усі правильні твердження.',
    'multiple_choice', 'beginner', 15,
    'TCP – надійний, з підтвердженням доставки, встановленням з\'єднання, впорядкованою доставкою, але повільніший. UDP – без підтвердження, менше overhead, підходить для стрімінгу та VoIP.',
    [['TCP гарантує доставку і порядок пакетів', true],
     ['UDP не встановлює з\'єднання перед відправкою', true],
     ['UDP підходить для відеострімінгу та онлайн-ігор', true],
     ['TCP швидший за UDP через відсутність підтвердження', false],
     ['UDP гарантує відсутність дублювання пакетів', false]]],

  ['computer-networks', 'Що таке DNS і яка його основна функція?',
    'Оберіть правильне твердження.',
    'single_choice', 'beginner', 10,
    'DNS (Domain Name System) перетворює людинозрозумілі доменні імена (google.com) на IP-адреси. Це ієрархічна розподілена система з кешуванням на рівні клієнта, провайдера та DNS-серверів.',
    [['Перетворення доменних імен на IP-адреси', true],
     ['Шифрування трафіку між клієнтом і сервером', false],
     ['Балансування навантаження між серверами', false],
     ['Протокол передачі файлів між хостами', false]]],

  ['computer-networks', 'Яка різниця між HTTP і HTTPS?',
    'Оберіть найточніше твердження.',
    'single_choice', 'beginner', 10,
    'HTTPS = HTTP + TLS (Transport Layer Security). TLS шифрує трафік і автентифікує сервер через сертифікат. Без HTTPS дані передаються відкритим текстом і можуть бути перехоплені.',
    [['HTTPS шифрує трафік за допомогою TLS на відміну від відкритого HTTP', true],
     ['HTTPS і HTTP ідентичні, різниця лише в номері порту', false],
     ['HTTPS шифрує лише заголовки, але не тіло запиту', false],
     ['HTTP використовує порт 443, HTTPS – 80', false]]],

  ['computer-networks', 'На якому рівні моделі OSI працює IP-протокол?',
    'Оберіть правильну відповідь.',
    'single_choice', 'beginner', 10,
    'IP (Internet Protocol) працює на мережевому рівні (3). Канальний рівень (2) – Ethernet/MAC. Транспортний (4) – TCP/UDP. Прикладний (7) – HTTP/FTP/DNS.',
    [['Мережевий рівень (3)', true],
     ['Канальний рівень (2)', false],
     ['Транспортний рівень (4)', false],
     ['Прикладний рівень (7)', false]]],

  // ── Mathematics ───────────────────────────────────────────
  ['mathematics', 'Яка похідна функції f(x) = sin(x)?',
    'Оберіть правильну відповідь.',
    'single_choice', 'beginner', 10,
    'Похідна sin(x) = cos(x). Це одна з базових формул диференціювання, що випливає з означення похідної через границю.',
    [['cos(x)', true], ['-cos(x)', false], ['sin(x)', false], ['-sin(x)', false]]],

  ['mathematics', 'Що таке визначник матриці 2×2: [[a,b],[c,d]]?',
    'Оберіть правильну формулу.',
    'single_choice', 'beginner', 10,
    'Визначник матриці 2×2: det = ad - bc. Це площа паралелограма, утвореного рядками матриці. Якщо det = 0, матриця вироджена (рядки лінійно залежні).',
    [['ad - bc', true], ['ab - cd', false], ['ac + bd', false], ['ad + bc', false]]],

  ['mathematics', 'Що таке метод Гауса?',
    'Опишіть своїми словами призначення і суть методу Гауса для розв\'язання систем лінійних рівнянь.',
    'text', 'intermediate', 20,
    'Метод Гауса (Gaussian Elimination) – алгоритм розв\'язання СЛАР за допомогою елементарних рядкових перетворень матриці. Зводить розширену матрицю до трикутного вигляду, після чого застосовується зворотна підстановка.',
    []],

  // ── Software Engineering ───────────────────────────────────
  ['software-engineering', 'Що таке принцип "Відкрито/Закрито" (Open/Closed Principle)?',
    'Оберіть правильне визначення.',
    'single_choice', 'intermediate', 20,
    'OCP: програмні сутності мають бути відкриті для розширення (можна додавати поведінку), але закриті для модифікації (не потрібно змінювати існуючий код). Реалізується через абстракції та поліморфізм.',
    [['Класи мають бути відкриті для розширення, але закриті для модифікації', true],
     ['Метод має виконувати лише одну задачу', false],
     ['Залежати від абстракцій, а не від конкретних реалізацій', false],
     ['Клієнти не повинні залежати від методів, які не використовують', false]]],

  ['software-engineering', 'Що таке TDD (Test-Driven Development)?',
    'Оберіть правильний опис циклу TDD.',
    'single_choice', 'intermediate', 20,
    'TDD: Red → Green → Refactor. Спочатку пишеться тест, що не проходить (Red). Потім мінімальний код для проходження тесту (Green). Потім рефакторинг без порушення тестів.',
    [['Red-Green-Refactor: спочатку тест, потім код, потім рефакторинг', true],
     ['Спочатку повна реалізація, потім написання тестів', false],
     ['Тестування лише після фінального code review', false],
     ['Автоматичне генерування тестів із коду', false]]],

  ['software-engineering', 'Що таке CI/CD?',
    'Оберіть усі правильні твердження.',
    'multiple_choice', 'beginner', 15,
    'CI (Continuous Integration) – автоматична збірка та тестування при кожному коміті. CD (Continuous Delivery/Deployment) – автоматична доставка або розгортання у виробниче середовище.',
    [['CI автоматично збирає та тестує код при кожному коміті', true],
     ['CD автоматично доставляє або розгортає перевірений код', true],
     ['CI/CD вимагає ручного тестування перед кожним релізом', false],
     ['CI зменшує ризики завдяки частій інтеграції змін', true]]],
]

// ── Insert tasks ────────────────────────────────────────────────
let totalTasks = 0
let totalOptions = 0

for (const [topicSlug, title, description, type, difficulty, xp, explanation, options] of TASK_DEFS) {
  const tId = topicId[topicSlug]
  if (!tId) { console.warn(`No topic for slug: ${topicSlug}`); continue }

  const { data: task, error: te } = await supabase.from('tasks').insert({
    topic_id: tId, title, description, type, difficulty,
    xp_reward: xp, is_published: true, explanation
  }).select('id').single()

  if (te) { err(`task "${title.slice(0,40)}"`, te); continue }
  totalTasks++

  if (options.length > 0) {
    const opts = options.map(([text, is_correct], i) => ({
      task_id: task.id, text, is_correct, order_num: i
    }))
    const { error: oe } = await supabase.from('task_options').insert(opts)
    if (oe) err(`options for "${title.slice(0,30)}"`, oe)
    else totalOptions += opts.length
  }
}
console.log(`\n✓ Tasks inserted: ${totalTasks}, options: ${totalOptions}`)

// ── 3. MATERIALS ───────────────────────────────────────────────
const MATERIALS = [
  // Algorithms
  { slug: 'big-o-notation-guide', topic: 'algorithms-ds', title: 'Big O нотація: повний посібник', type: 'article',
    content: 'Детальний огляд асимптотичної складності алгоритмів. O(1), O(log n), O(n), O(n log n), O(n²). Практичні приклади для кожного класу складності з реальним кодом на JavaScript.',
    url: 'https://www.freecodecamp.org/news/big-o-notation-why-it-matters-and-why-it-doesnt-1674cfa8a23c/' },
  { slug: 'visualgo-ds', topic: 'algorithms-ds', title: 'VisuAlgo – візуалізація алгоритмів', type: 'link',
    content: 'Інтерактивна платформа для покрокової візуалізації сортування, пошуку, дерев, графів та хеш-таблиць.',
    url: 'https://visualgo.net/en' },
  { slug: 'sorting-algorithms-video', topic: 'algorithms-ds', title: 'Алгоритми сортування: порівняння та аналіз', type: 'video',
    content: 'Відеолекція з порівнянням bubble sort, merge sort, quick sort та heap sort. Часова та просторова складність кожного.',
    url: 'https://www.youtube.com/watch?v=kgBjXUE_Nwc' },
  { slug: 'graph-algorithms-dfs-bfs', topic: 'algorithms-ds', title: 'DFS і BFS: обхід графів', type: 'article',
    content: 'Детальне пояснення алгоритмів пошуку в глибину і ширину. Реалізація на Python і JavaScript, застосування: топологічне сортування, пошук компонент зв\'язності, найкоротший шлях.',
    url: 'https://cp-algorithms.com/graph/depth-first-search.html' },

  // Databases
  { slug: 'sql-tutorial-mode', topic: 'databases', title: 'SQL Tutorial – Mode Analytics', type: 'link',
    content: 'Інтерактивний туторіал SQL: SELECT, JOIN, GROUP BY, subqueries, window functions. Виконання запитів прямо в браузері на реальному датасеті.',
    url: 'https://mode.com/sql-tutorial/' },
  { slug: 'database-normalization', topic: 'databases', title: 'Нормалізація бази даних: 1НФ, 2НФ, 3НФ', type: 'article',
    content: 'Покрокове пояснення нормальних форм з прикладами. Як привести таблицю до 3НФ і навіщо це потрібно для усунення аномалій.',
    url: 'https://www.guru99.com/database-normalization.html' },
  { slug: 'acid-transactions', topic: 'databases', title: 'ACID транзакції: що це і як працює', type: 'article',
    content: 'Глибоке занурення в ACID: атомарність, узгодженість, ізоляція, довговічність. Приклади з PostgreSQL. Рівні ізоляції: Read Uncommitted, Read Committed, Repeatable Read, Serializable.',
    url: 'https://www.postgresql.org/docs/current/tutorial-transactions.html' },
  { slug: 'sql-joins-visual', topic: 'databases', title: 'Візуальне пояснення SQL JOIN', type: 'link',
    content: 'Діаграми Венна для INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN, CROSS JOIN. Найпростіше пояснення для початківців.',
    url: 'https://www.codeproject.com/Articles/33052/Visual-Representation-of-SQL-Joins' },

  // Web Development
  { slug: 'http-fundamentals', topic: 'web-development', title: 'HTTP: методи, статус-коди, заголовки', type: 'article',
    content: 'Повний огляд протоколу HTTP/1.1 та HTTP/2. Методи (GET, POST, PUT, PATCH, DELETE), статус-коди (2xx, 3xx, 4xx, 5xx), заголовки кешування та безпеки.',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview' },
  { slug: 'javascript-event-loop', topic: 'web-development', title: 'JavaScript Event Loop: мікрозавдання та макрозавдання', type: 'video',
    content: 'Philip Roberts "What the heck is the event loop anyway?" – класична доповідь JSConf EU. Анімована візуалізація call stack, callback queue, event loop.',
    url: 'https://www.youtube.com/watch?v=8aGhZQkoFbQ' },
  { slug: 'rest-api-best-practices', topic: 'web-development', title: 'REST API: кращі практики проектування', type: 'article',
    content: 'Іменування ендпоінтів, версіонування API, обробка помилок, пагінація, автентифікація (JWT, OAuth). Реальні приклади з GitHub API та Stripe API.',
    url: 'https://restfulapi.net/' },
  { slug: 'css-flexbox-grid', topic: 'web-development', title: 'CSS Flexbox і Grid: вичерпний посібник', type: 'article',
    content: 'Flexbox для одновимірного розкладання, Grid для двовимірного. Інтерактивні приклади, поширені патерни верстки, коли що обирати.',
    url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/' },

  // Mathematics
  { slug: '3blue1brown-linear-algebra', topic: 'mathematics', title: 'Essence of Linear Algebra – 3Blue1Brown', type: 'video',
    content: 'Серія відео про лінійну алгебру від 3Blue1Brown. Геометрична інтуїція для векторів, матриць, детермінантів, власних значень. Обов\'язково для всіх хто хоче зрозуміти, а не просто обчислювати.',
    url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab' },
  { slug: 'calculus-khan', topic: 'mathematics', title: 'Математичний аналіз – Khan Academy', type: 'link',
    content: 'Повний курс матаналізу: границі, похідні, інтеграли, ряди. Відеоуроки + практика з автоматичною перевіркою. Безкоштовно.',
    url: 'https://www.khanacademy.org/math/calculus-1' },

  // OOP
  { slug: 'solid-principles-guide', topic: 'oop', title: 'SOLID принципи: практичний посібник', type: 'article',
    content: 'Детальний розбір кожного принципу SOLID з прикладами на TypeScript. Коли порушувати SOLID виправдано, а коли – ні.',
    url: 'https://www.digitalocean.com/community/conceptual-articles/s-o-l-i-d-the-first-five-principles-of-object-oriented-design' },
  { slug: 'design-patterns-refactoring-guru', topic: 'oop', title: 'Патерни проектування – Refactoring.Guru', type: 'link',
    content: 'Найкращий ресурс з патернів GoF: Creational, Structural, Behavioral. Кожен патерн пояснено з аналогією з реального життя, UML-діаграмою та прикладом коду.',
    url: 'https://refactoring.guru/uk/design-patterns' },

  // OS
  { slug: 'os-processes-threads', topic: 'operating-systems', title: 'Процеси та потоки: від теорії до практики', type: 'article',
    content: 'Що таке процес, PCB, контекстне перемикання, IPC (pipes, shared memory, sockets). Потоки: POSIX threads, race conditions, mutex, semaphore.',
    url: 'https://www.geeksforgeeks.org/difference-between-process-and-thread/' },

  // Networks
  { slug: 'computer-networks-osi', topic: 'computer-networks', title: 'Модель OSI: всі 7 рівнів з прикладами', type: 'article',
    content: 'Детальне пояснення 7 рівнів OSI та їх відповідність TCP/IP. Де працюють Ethernet, IP, TCP, HTTP, TLS. Реальні приклади для кожного рівня.',
    url: 'https://www.cloudflare.com/learning/ddos/glossary/open-systems-interconnection-model-osi/' },
]

let totalMaterials = 0
for (const m of MATERIALS) {
  const tId = topicId[m.topic]
  if (!tId) { console.warn(`No topic for slug: ${m.topic}`); continue }
  const { error: me } = await supabase.from('materials').insert({
    topic_id: tId, title: m.title, type: m.type,
    content: m.content, url: m.url, slug: m.slug, is_published: true
  })
  if (me) err(`material "${m.title.slice(0,40)}"`, me)
  else totalMaterials++
}
console.log(`✓ Materials inserted: ${totalMaterials}`)

// ── 4. POSTS ───────────────────────────────────────────────────
// Get real user IDs
const { data: users } = await supabase.from('profiles').select('id').order('created_at').limit(3)
if (!users || users.length === 0) {
  console.log('⚠ No users found – skipping posts')
  process.exit(0)
}
const u = [users[0]?.id, users[1]?.id ?? users[0]?.id, users[2]?.id ?? users[0]?.id]

// Ensure tags exist
const TAGS = [
  { slug: 'алгоритми', display_name: 'Алгоритми та структури даних' },
  { slug: 'бази-даних', display_name: 'Бази даних' },
  { slug: 'веб', display_name: 'Веб-розробка' },
  { slug: 'математика', display_name: 'Математика' },
  { slug: 'ооп', display_name: 'Об\'єктно-орієнтоване програмування' },
  { slug: 'питання', display_name: 'Запитання' },
  { slug: 'допомога', display_name: 'Прошу про допомогу' },
  { slug: 'ресурси', display_name: 'Корисні ресурси' },
  { slug: 'обговорення', display_name: 'Обговорення' },
  { slug: 'думки', display_name: 'Думки' },
  { slug: 'корисне', display_name: 'Корисне' },
]
await supabase.from('tags').upsert(TAGS, { onConflict: 'slug', ignoreDuplicates: true })

const POSTS = [
  { user: u[0], kind: 'discussion', tags: ['алгоритми', 'обговорення'], hours: 1,
    content: 'Нарешті "дійшло" чому quicksort на практиці швидший за mergesort навіть з однаковим O(n log n) – справа в константі та кеш-локальності. Quicksort дуже кеш-дружний бо обходить масив послідовно 🚀' },
  { user: u[1], kind: 'question', title: 'Коли варто використовувати B-дерево замість хеш-індексу?', tags: ['бази-даних', 'питання'], hours: 3,
    content: 'Розбираюся з індексами PostgreSQL. B-tree – за замовчуванням, Hash – для точного пошуку. Але коли реально вигідний Hash? Є критерії вибору крім "тільки для ==" ?', is_solved: false },
  { user: u[2], kind: 'share', tags: ['алгоритми', 'ресурси', 'корисне'], hours: 6,
    content: 'Знайшла ідеальний ресурс для підготовки до технічних інтерв\'ю – LeetCode + CP-Algorithms.com. Другий особливо класний: алгоритми на графах з доведеннями і кодом на C++.',
    url: 'https://cp-algorithms.com', url_title: 'CP-Algorithms.com – E-Maxx Algorithms in English' },
  { user: u[0], kind: 'discussion', tags: ['веб', 'обговорення'], hours: 12,
    content: 'Цікаво ваша думка: чи варто в 2025 вчити ванільний JS перед React/Vue, чи одразу фреймворк? Я вчив спочатку JS – зараз розумію що відбувається "під капотом". Але займає більше часу.' },
  { user: u[1], kind: 'question', title: 'Як правильно розраховувати часову складність рекурсивних функцій?', tags: ['алгоритми', 'питання', 'допомога'], hours: 18,
    content: 'Маю рекурсивну функцію fibonacci(n). Знаю що наївна реалізація O(2^n), але не розумію як це вивести формально через Master Theorem або дерево рекурсії. Хтось може пояснити?', is_solved: false },
  { user: u[2], kind: 'share', tags: ['математика', 'ресурси'], hours: 24,
    content: '3Blue1Brown випустив нову серію про нейромережі – "But what is a neural network?" Пояснює через лінійну алгебру і геометрію. Обов\'язково подивіться якщо вивчаєте ML.',
    url: 'https://www.youtube.com/watch?v=aircAruvnKk', url_title: 'But what is a neural network? – 3Blue1Brown' },
  { user: u[0], kind: 'discussion', tags: ['ооп', 'обговорення'], hours: 36,
    content: 'Після 2 місяців практики SOLID – помітив що найскладніший для дотримання це Dependency Inversion Principle. Дуже легко починаєш конкретну реалізацію через new замість інтерфейсу. Яким способом ви боретесь з цим?' },
  { user: u[1], kind: 'share', tags: ['бази-даних', 'ресурси', 'корисне'], hours: 48,
    content: 'use-the-index-luke.com – найкращий безкоштовний ресурс з SQL-індексів. Пояснює як СУБД обирає план виконання, коли індекс не використовується і як це виправити.',
    url: 'https://use-the-index-luke.com', url_title: 'Use The Index, Luke – SQL indexing and tuning' },
  { user: u[2], kind: 'question', title: 'Event loop в Node.js vs браузері – є різниця?', tags: ['веб', 'питання'], hours: 72,
    content: 'Читав що Node.js і браузер мають різні реалізації event loop. В браузері є RAF (requestAnimationFrame), в Node.js – додаткові фази (timers, I/O, idle, poll, check, close). Чи потрібно розуміти ці відмінності для фронтенд-розробника?', is_solved: true },
  { user: u[0], kind: 'discussion', tags: ['обговорення', 'думки'], hours: 96,
    content: 'Цікаве спостереження: коли вчиш новий алгоритм – спочатку здається неможливим. Після 20 задач на LeetCode – стає очевидним. Мозок буквально перебудовує патерни мислення 🧠 Не здавайтесь на перших задачах!' },
  { user: u[1], kind: 'share', tags: ['ресурси', 'корисне'], hours: 120,
    content: 'Roadmap.sh – структурований план навчання для будь-якого напряму: Frontend, Backend, DevOps, AI. Особливо корисно щоб не губитися в морі технологій.',
    url: 'https://roadmap.sh', url_title: 'roadmap.sh – Developer Roadmaps' },
  { user: u[2], kind: 'discussion', tags: ['алгоритми', 'думки'], hours: 144,
    content: 'Навіщо вчити алгоритми якщо є готові бібліотеки? Бо коли ти розумієш O(n²) vs O(n log n) – ти бачиш де твій код буде повільним ще до запуску. Це зберігає години дебагінгу.' },
]

let totalPosts = 0
for (const post of POSTS) {
  const postData = {
    user_id: post.user,
    kind: post.kind,
    content: post.content,
    created_at: new Date(Date.now() - post.hours * 3600000).toISOString(),
    ...(post.title && { title: post.title }),
    ...(post.url && { url: post.url, url_title: post.url_title }),
    ...(post.is_solved !== undefined && { is_solved: post.is_solved }),
  }
  const { data: p, error: pe } = await supabase.from('posts').insert(postData).select('id').single()
  if (pe) { err('post', pe); continue }

  // tags
  if (post.tags?.length) {
    await supabase.from('post_tags').insert(
      post.tags.map(tag => ({ post_id: p.id, tag_slug: tag }))
    )
  }
  totalPosts++
}
console.log(`✓ Posts inserted: ${totalPosts}`)
console.log('\n🎉 Seed complete!')
