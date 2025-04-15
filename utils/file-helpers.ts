export const normalizeFileName = (fileName: string): string => {
  // Транслитерация кириллицы
  const translitMap: { [key: string]: string } = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
    'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };

  return fileName
    .toLowerCase()
    // Транслитерация
    .split('')
    .map(char => translitMap[char] || char)
    .join('')
    // Замена всех небезопасных символов на дефис
    .replace(/[^a-z0-9.-]/g, '-')
    // Удаление множественных дефисов
    .replace(/-+/g, '-');
};
